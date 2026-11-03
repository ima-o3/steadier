#!/usr/bin/env bash
set -euo pipefail
mkdir -p build/simulator
device_id="$(xcrun simctl list devices available -j | python3 -c 'import json,sys; print(next(d["udid"] for group in json.load(sys.stdin)["devices"].values() for d in group if d["name"].startswith("iPhone")))')"
# Simulator-only identity: no Apple account/certificate and no device signing.
# Disabling code signing entirely strips the identity Keychain needs.
python3 - <<'PY'
import os, plistlib
from pathlib import Path
identifier = 'STEADIERSIM.' + os.environ.get('IOS_BUNDLE_IDENTIFIER', 'com.ima03.steadier')
Path('build/simulator/entitlements.plist').write_bytes(plistlib.dumps({
    'application-identifier': identifier,
    'keychain-access-groups': [identifier],
}))
PY
xcodebuild -workspace ios/Steadier.xcworkspace -scheme Steadier \
  -configuration Release -sdk iphonesimulator -destination "platform=iOS Simulator,id=$device_id" \
  -derivedDataPath build/SimulatorDerivedData ONLY_ACTIVE_ARCH=YES \
  CODE_SIGNING_ALLOWED=YES CODE_SIGNING_REQUIRED=YES CODE_SIGN_IDENTITY=- DEVELOPMENT_TEAM= \
  CODE_SIGN_ENTITLEMENTS="$PWD/build/simulator/entitlements.plist" \
  build > build/simulator/compile.log 2>&1
codesign -d --entitlements :- build/SimulatorDerivedData/Build/Products/Release-iphonesimulator/Steadier.app > build/simulator/signed-entitlements.plist 2> build/simulator/signing.log
xcrun simctl boot "$device_id"
xcrun simctl bootstatus "$device_id" -b
xcrun simctl install "$device_id" build/SimulatorDerivedData/Build/Products/Release-iphonesimulator/Steadier.app
xcrun simctl launch "$device_id" "${IOS_BUNDLE_IDENTIFIER:-com.ima03.steadier}"
sleep 25
xcrun simctl io "$device_id" screenshot build/simulator/startup.png
xcrun simctl spawn "$device_id" log show --last 3m --style compact \
  --predicate 'process == "Steadier"' > build/simulator/runtime.log 2>&1
echo 'Simulator startup screenshot and runtime log captured.'
data_path="$(xcrun simctl get_app_container "$device_id" "${IOS_BUNDLE_IDENTIFIER:-com.ima03.steadier}" data)"
python3 - "$data_path" <<'PY'
import json, sys
from pathlib import Path
databases = list(Path(sys.argv[1]).rglob('steadier.db'))
assert len(databases) == 1, 'Startup did not create exactly one database.'
header = databases[0].read_bytes()[:16]
assert len(header) == 16 and header != b'SQLite format 3\x00', 'Database is empty or has a plaintext SQLite header.'
Path('build/simulator/storage-check.json').write_text(json.dumps({'databaseCreated': True, 'plaintextSQLiteHeader': False}))
PY
