import { expect, it } from "vitest";
import { googleUrlScheme } from "../../app.config";
it("derives the reverse OAuth scheme and rejects incomplete or mismatched native configuration", () => {
  expect(googleUrlScheme()).toBeUndefined();
  expect(googleUrlScheme("123-abc.apps.googleusercontent.com")).toBe(
    "com.googleusercontent.apps.123-abc",
  );
  expect(() =>
    googleUrlScheme(undefined, "com.googleusercontent.apps.123-abc"),
  ).toThrow();
  expect(() =>
    googleUrlScheme("123-abc.apps.googleusercontent.com", "wrong"),
  ).toThrow();
});
