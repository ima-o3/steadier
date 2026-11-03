#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo 'This script runs on the cloud macOS runner, not on Windows.' >&2
  exit 1
fi

project_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_root"
export EXPO_NO_TELEMETRY=1
export CI=1
export NODE_BINARY="$(command -v node)"
export IOS_BUNDLE_IDENTIFIER="${IOS_BUNDLE_IDENTIFIER:-com.ima03.steadier}"
unset SKIP_BUNDLING
mkdir -p build/logs build/sideload
xcodebuild -version

# Continuous Native Generation retains SQLCipher and SecureStore plugins.
# CocoaPods runs separately so its failure log is preserved.
if [[ "${BUILD_STAGE:-all}" != "device" ]]; then
pnpm exec expo prebuild --platform ios --no-install 2>&1 | tee build/logs/prebuild.log
python3 - <<'PY'
import json
from pathlib import Path
props = json.loads(Path('ios/Podfile.properties.json').read_text())
if str(props.get('expo.sqlite.useSQLCipher')).lower() != 'true':
    raise SystemExit('Refusing to build without SQLCipher enabled.')
PY

printf 'export NODE_BINARY="%s"\n' "$NODE_BINARY" > ios/.xcode.env.local
(cd ios && pod install) 2>&1 | tee build/logs/pods.log
python3 - <<'PY'
from pathlib import Path
config = Path('ios/Pods/Target Support Files/ExpoSQLite/ExpoSQLite.release.xcconfig')
if not config.is_file() or 'SQLITE_HAS_CODEC' not in config.read_text():
    raise SystemExit('Refusing to build: ExpoSQLite Release compiler configuration does not enable SQLCipher.')
print('Verified SQLCipher in the generated ExpoSQLite Release compiler configuration.')
PY
if [[ "${USE_CCACHE:-0}" == "1" ]]; then
  if ! grep -q 'ccache-clang' ios/Pods/Pods.xcodeproj/project.pbxproj; then
    echo 'Compiler caching was requested but CocoaPods did not enable it.' >&2
    exit 1
  fi
  echo 'Verified React Native compiler-cache integration.'
fi

if [[ "${SIMULATOR_SMOKE:-0}" == "1" ]]; then
  bash scripts/smoke-ios-simulator.sh
fi
fi
if [[ "${BUILD_STAGE:-all}" == "prepare" ]]; then
  exit 0
fi

# Build for physical iPhones, not an iOS simulator. Signing is performed later
# by Sideloadly on the user's PC. No Apple login/certificate is used here.
python3 scripts/run-xcode-build.py --log build/logs/xcodebuild.log -- xcodebuild \
  -workspace ios/Steadier.xcworkspace \
  -scheme Steadier \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build/DerivedData \
  -showBuildTimingSummary \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY= \
  DEVELOPMENT_TEAM= \
  ONLY_ACTIVE_ARCH=NO \
  build

app_path="$project_root/build/DerivedData/Build/Products/Release-iphoneos/Steadier.app"
if [[ ! -d "$app_path" ]]; then
  echo 'Xcode did not produce Steadier.app for iphoneos.' >&2
  exit 1
fi
# Preserve the compiled app if a later packaging check needs investigation.
ditto -c -k --keepParent "$app_path" build/sideload/Steadier-built-app.zip
lipo "$app_path/Steadier" -verify_arch arm64
python3 scripts/package-unsigned-ipa.py "$app_path" build/sideload/Steadier-unsigned.ipa

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  cat >> "$GITHUB_STEP_SUMMARY" <<'SUMMARY'
## Steadier unsigned iPhone IPA

Download **Steadier-unsigned-iphone** from this run's Artifacts section and extract the ZIP on Windows.
The IPA is an unsigned Release build with embedded JavaScript. It is not yet installed or device-tested.
Use Sideloadly locally with your own Apple ID to sign/install, then refresh before the seven-day signature expires.
No Apple credentials are used in this workflow. Weekly refreshes reuse the downloaded IPA; do not rebuild every week.
SUMMARY
fi
