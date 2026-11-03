"""Name an unsigned IPA and GitHub artifact from compiled Info.plist metadata.

The packager writes build-info.json from the actual .app/Info.plist. The
resulting versioned filename avoids ambiguity between iPhone releases.
"""
import json
from pathlib import Path
import re
import sys


def rename_ipa(folder: Path, output_file: Path | None = None) -> tuple[str, Path]:
    info = json.loads((folder / "build-info.json").read_text(encoding="utf-8"))
    version = info.get("version")
    build = info.get("buildNumber")
    if not isinstance(version, str) or not re.fullmatch(r"[0-9]+(?:\.[0-9]+){2}", version):
        raise ValueError("Missing or invalid compiled app version")
    if not isinstance(build, str) or not re.fullmatch(r"[0-9]+", build):
        raise ValueError("Missing or invalid compiled iOS build number")
    digest = info.get("sha256")
    if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
        raise ValueError("Missing packaged IPA SHA-256")

    original = folder / "Steadier-unsigned.ipa"
    original_checksum = folder / "Steadier-unsigned.ipa.sha256"
    if not original.is_file() or not original_checksum.is_file():
        raise FileNotFoundError("Compiled IPA or SHA-256 file missing")
    file_name = f"Steadier-v{version}-build{build}-unsigned.ipa"
    destination = folder / file_name
    if destination.exists():
        raise FileExistsError(f"Refusing to overwrite {destination}")
    original.rename(destination)
    original_checksum.unlink()
    (folder / f"{file_name}.sha256").write_text(
        f"{digest}  {file_name}\n", encoding="utf-8"
    )
    name = f"Steadier-v{version}-build{build}-unsigned-iphone"
    if output_file is not None:
        with output_file.open("a", encoding="utf-8") as stream:
            stream.write(f"artifact_name={name}\n")
    return name, destination


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3):
        raise SystemExit("Usage: name-unsigned-ipa.py folder [GITHUB_OUTPUT]")
    name, destination = rename_ipa(
        Path(sys.argv[1]), Path(sys.argv[2]) if len(sys.argv) == 3 else None
    )
    print(f"Named {destination} (GitHub artifact: {name})")
