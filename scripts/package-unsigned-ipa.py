"""Package a built iphoneos .app for local signing; never signs or uploads it."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import plistlib
import stat
import sys
import zipfile


def package_app(app: Path, output: Path) -> dict:
    app = app.resolve(strict=True)
    if not app.is_dir() or app.suffix != '.app':
        raise ValueError('Expected an existing .app directory.')
    with (app / 'Info.plist').open('rb') as stream:
        info = plistlib.load(stream)
    if 'iPhoneOS' not in info.get('CFBundleSupportedPlatforms', []):
        raise ValueError('This is not a physical iPhone build (iPhoneOS).')
    executable = info.get('CFBundleExecutable', '')
    if not executable or Path(executable).name != executable or not (app / executable).is_file():
        raise ValueError('The app executable is missing or invalid.')
    bundle_id = info.get('CFBundleIdentifier', '')
    if not isinstance(bundle_id, str) or len(bundle_id.split('.')) < 2:
        raise ValueError('The app bundle identifier is missing or invalid.')
    if not (app / 'main.jsbundle').is_file() or not (app / 'main.jsbundle').stat().st_size:
        raise ValueError('Missing embedded JavaScript. A Metro-dependent app is not a standalone release.')
    if (app / 'embedded.mobileprovision').exists():
        raise ValueError('Unexpected provisioning profile in an unsigned cloud build.')

    entries = sorted(app.rglob('*'))
    # Reject escaping symlinks before producing any artifact.
    for entry in entries:
        if entry.is_symlink() and not entry.resolve().is_relative_to(app):
            raise ValueError(f'App symlink escapes its bundle: {entry.name}')
    output = output.resolve()
    if output.is_relative_to(app):
        raise ValueError('The IPA output must be outside the source app.')
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for entry in entries:
            name = (Path('Payload') / app.name / entry.relative_to(app)).as_posix()
            if entry.is_symlink():
                metadata = zipfile.ZipInfo(name)
                metadata.create_system = 3
                metadata.external_attr = (stat.S_IFLNK | 0o777) << 16
                archive.writestr(metadata, os.readlink(entry))
            elif entry.is_file():
                archive.write(entry, name)
    with output.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    output.with_suffix(output.suffix + '.sha256').write_text(f'{digest}  {output.name}\n', encoding='utf-8')
    result = {
        'bundleIdentifier': bundle_id,
        'version': info.get('CFBundleShortVersionString'),
        'buildNumber': info.get('CFBundleVersion'),
        'minimumIOSVersion': info.get('MinimumOSVersion'),
        'platform': 'iPhoneOS',
        'configuration': 'Release',
        'signed': False,
        'sha256': digest,
        'sourceCommit': os.environ.get('GITHUB_SHA'),
        'installation': 'Sign locally using your own Apple ID. Free signing requires refresh within 7 days.',
    }
    (output.parent / 'build-info.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return result


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: package-unsigned-ipa.py path/to/App.app output.ipa')
    print(json.dumps(package_app(Path(sys.argv[1]), Path(sys.argv[2])), indent=2))
