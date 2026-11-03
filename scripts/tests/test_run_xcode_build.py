import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


WRAPPER = Path(__file__).resolve().parents[1] / "run-xcode-build.py"


class BuildLoggingTests(unittest.TestCase):
    def run_build(self, source):
        with tempfile.TemporaryDirectory(prefix="steadier build ") as folder:
            log = Path(folder) / "nested" / "build.log"
            result = subprocess.run(
                [sys.executable, str(WRAPPER), "--log", str(log), "--interval", "0.1", "--", sys.executable, "-u", "-c", source],
                capture_output=True, text=True, timeout=10,
            )
            return result, log.read_text()

    def test_keeps_verbose_output_in_log_without_streaming_it(self):
        result, log = self.run_build("print('compiler argument line\\n' * 10000)")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertGreater(len(log), 200000)
        self.assertNotIn("compiler argument line", result.stdout)
        self.assertIn("exit 0", result.stdout)

    def test_preserves_failure_code_and_diagnostics(self):
        result, log = self.run_build("import sys; print('error: compilation failed', file=sys.stderr); sys.exit(7)")
        self.assertEqual(result.returncode, 7)
        self.assertIn("error: compilation failed", log)
        self.assertIn("error: compilation failed", result.stdout)

    def test_reports_recent_target_while_build_is_running(self):
        result, _ = self.run_build("import time; print(\"CompileC source.o (in target 'RNScreens' from project 'Pods')\"); time.sleep(.4)")
        self.assertEqual(result.returncode, 0)
        self.assertIn("CompileC: RNScreens", result.stdout)


if __name__ == "__main__":
    unittest.main()
