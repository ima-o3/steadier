#!/usr/bin/env bash
set -euo pipefail
mkdir -p build/simulator
xcodebuild -workspace ios/Steadier.xcworkspace -scheme Steadier \
  -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build/SimulatorDerivedData CODE_SIGNING_ALLOWED=NO \
  build > build/simulator/compile.log 2>&1
device_id="$(xcrun simctl list devices available -j | python3 -c 'import json,sys; print(next(d["udid"] for group in json.load(sys.stdin)["devices"].values() for d in group if d["name"].startswith("iPhone")))')"
xcrun simctl boot "$device_id"
xcrun simctl bootstatus "$device_id" -b
xcrun simctl install "$device_id" build/SimulatorDerivedData/Build/Products/Release-iphonesimulator/Steadier.app
xcrun simctl launch "$device_id" "${IOS_BUNDLE_IDENTIFIER:-com.ima03.steadier}"
sleep 25
xcrun simctl io "$device_id" screenshot build/simulator/startup.png
xcrun simctl spawn "$device_id" log show --last 3m --style compact \
  --predicate 'process == "Steadier"' > build/simulator/runtime.log 2>&1
echo 'Simulator startup screenshot and runtime log captured.'
