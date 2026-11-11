import base from "./app.json";
export function googleUrlScheme(clientId?: string, configuredScheme?: string) {
  if (!clientId && !configuredScheme) return undefined;
  if (
    !clientId ||
    !/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(clientId)
  )
    throw Error("Set a valid Google iOS OAuth client ID before building.");
  const expected = `com.googleusercontent.apps.${clientId.replace(/\.apps\.googleusercontent\.com$/, "")}`;
  if (configuredScheme && configuredScheme !== expected)
    throw Error(
      "The Google iOS URL scheme does not match the OAuth client ID.",
    );
  return expected;
}

export default () => {
  const scheme = googleUrlScheme(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_IOS_URL_SCHEME,
  );
  return {
    ...base.expo,
    ios: {
      ...base.expo.ios,
      bundleIdentifier:
        process.env.IOS_BUNDLE_IDENTIFIER || base.expo.ios.bundleIdentifier,
    },
    plugins: [
      ...base.expo.plugins,
      "./plugins/with-screen-time.cjs",
      ...(scheme
        ? [
            [
              "@react-native-google-signin/google-signin",
              { iosUrlScheme: scheme },
            ],
          ]
        : []),
    ],
  };
};
