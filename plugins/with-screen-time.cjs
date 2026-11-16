const {
  withEntitlementsPlist,
  withDangerousMod,
  withXcodeProject,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");
module.exports = function withScreenTime(config) {
  const name = "ScreenTimeReport";
  const bundle = config.ios.bundleIdentifier + "." + name;
  config = withEntitlementsPlist(config, (c) => {
    c.modResults["com.apple.developer.family-controls"] = true;
    return c;
  });
  config.extra = {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            appExtensions: [
              {
                targetName: name,
                bundleIdentifier: bundle,
                entitlements: { "com.apple.developer.family-controls": true },
              },
            ],
          },
        },
      },
    },
  };
  config = withDangerousMod(config, [
    "ios",
    async (c) => {
      fs.cpSync(
        path.join(c.modRequest.projectRoot, "native", name),
        path.join(c.modRequest.platformProjectRoot, name),
        { recursive: true },
      );
      return c;
    },
  ]);
  return withXcodeProject(config, (c) => {
    const p = c.modResults;
    if (
      Object.values(p.pbxNativeTargetSection()).some(
        (t) =>
          t &&
          typeof t === "object" &&
          String(t.name).replaceAll('"', "") === name,
      )
    )
      return c;
    const target = p.addTarget(name, "app_extension", name, bundle);
    // DeviceActivityReport is an ExtensionKit extension, not an NSExtension.
    target.pbxNativeTarget.productType = '"com.apple.product-type.extensionkit-extension"';
    const product = target.pbxNativeTarget.productReference;
    let embedded = false;
    for (const phase of Object.values(p.hash.project.objects.PBXCopyFilesBuildPhase || {})) {
      if (!phase || typeof phase !== "object") continue;
      const embedsReport = phase.files?.some(file => p.hash.project.objects.PBXBuildFile[file.value]?.fileRef === product);
      if (embedsReport) {
        phase.dstPath = '"$(CONTENTS_FOLDER_PATH)/Extensions"';
        phase.dstSubfolderSpec = 16;
        embedded = true;
      }
    }

    if (!embedded) throw new Error("Screen Time extension embedding phase was not found; refusing legacy packaging.");
    p.addBuildPhase(
      [name + "/SteadierReport.swift"],
      "PBXSourcesBuildPhase",
      "Sources",
      target.uuid,
    );
    p.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);
    for (const v of Object.values(p.pbxXCBuildConfigurationSection())) {
      if (
        !v ||
        typeof v !== "object" ||
        String(v.buildSettings?.PRODUCT_NAME).replaceAll('"', "") !== name
      )
        continue;
      Object.assign(v.buildSettings, {
        INFOPLIST_FILE: name + "/Info.plist",
        CODE_SIGN_ENTITLEMENTS: name + "/ScreenTimeReport.entitlements",
        IPHONEOS_DEPLOYMENT_TARGET: "16.0",
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: "1",
        APPLICATION_EXTENSION_API_ONLY: "YES",
        GENERATE_INFOPLIST_FILE: "YES",
        INFOPLIST_KEY_CFBundleDisplayName: '"Steadier Screen Time"',
        MARKETING_VERSION: config.version,
        CURRENT_PROJECT_VERSION: config.ios.buildNumber,
        CODE_SIGN_STYLE: "Automatic",
      });
    }
    return c;
  });
};

