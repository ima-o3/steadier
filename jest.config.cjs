module.exports = {
  preset: "jest-expo",
  testMatch: ["**/src/tests/**/*.component.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/"],
  watchman: false,
};
