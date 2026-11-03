"""Keep full Xcode diagnostics on disk without flooding the Actions log."""
import argparse
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import time


def latest_progress(path):
    with path.open("rb") as stream:
        stream.seek(max(0, path.stat().st_size - 65536))
        lines = stream.read().decode("utf-8", errors="replace").splitlines()
    for line in reversed(lines):
        if re.match(r"^(CompileC|SwiftCompile|SwiftEmitModule|Ld |Libtool|PhaseScriptExecution|CodeSign|Touch |\*\* BUILD)", line):
            target = re.search(r"in target '([^']+)'", line)
            return f"{line.split()[0]}: {target.group(1)}" if target else line[:180]
    return "Preparing or compiling (full output is being saved)"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--log", required=True, type=Path)
    parser.add_argument("--interval", type=float, default=30)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    if not command or args.interval <= 0:
        parser.error("Provide a command and a positive interval")
    args.log.parent.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    print(f"Starting native build; full log: {args.log}", flush=True)
    with args.log.open("wb") as output:
        process = subprocess.Popen(command, stdout=output, stderr=subprocess.STDOUT, start_new_session=os.name != "nt")
        def interrupted(_signal, _frame):
            raise KeyboardInterrupt
        signal.signal(signal.SIGTERM, interrupted)
        try:
            while True:
                try:
                    result = process.wait(timeout=args.interval)
                    break
                except subprocess.TimeoutExpired:
                    print(f"Native build {int(time.monotonic() - started)}s · {latest_progress(args.log)}", flush=True)
        except KeyboardInterrupt:
            result = 130
        finally:
            if process.poll() is None:
                if os.name == "nt":
                    process.terminate()
                else:
                    os.killpg(process.pid, signal.SIGTERM)
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    if os.name == "nt":
                        process.kill()
                    else:
                        os.killpg(process.pid, signal.SIGKILL)
                    process.wait()
    print(f"Native build finished in {int(time.monotonic() - started)}s (exit {result})", flush=True)
    if result:
        with args.log.open("rb") as stream:
            stream.seek(max(0, args.log.stat().st_size - 16384))
            print(stream.read().decode("utf-8", errors="replace"), flush=True)
    return result


if __name__ == "__main__":
    sys.exit(main())
