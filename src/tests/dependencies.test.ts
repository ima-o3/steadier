import { it, expect } from "vitest";
import { validateDependencies } from "../features/goals/dependencies";
import { action } from "./fixtures";
it("rejects cycles introduced while editing", () =>
  expect(() =>
    validateDependencies(
      "a",
      ["b"],
      [action, { ...action, id: "b", dependencies: ["a"] }],
    ),
  ).toThrow("cycle"));
it("rejects missing prerequisite ids", () =>
  expect(() => validateDependencies("new", ["missing"], [action])).toThrow(
    "existing",
  ));
it("allows a valid acyclic chain", () =>
  expect(validateDependencies("new", ["a"], [action])).toBeUndefined());
