import base from "./app.json";
export default () => ({
  ...base.expo,
  ios: {
    ...base.expo.ios,
    bundleIdentifier:
      process.env.IOS_BUNDLE_IDENTIFIER || base.expo.ios.bundleIdentifier,
  },
  plugins: [
    ...base.expo.plugins,
    ...(process.env.GOOGLE_IOS_URL_SCHEME
      ? [
          [
            "@react-native-google-signin/google-signin",
            { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME },
          ],
        ]
      : []),
  ],
});
