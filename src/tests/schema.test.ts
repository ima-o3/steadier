import { DatabaseSync } from "node:sqlite";
import { it, expect } from "vitest";
import { migration1 } from "../database/migrations/001";
it("creates all versioned relational tables and enforces foreign keys", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON;");
  db.exec(migration1);
  expect(db.prepare("PRAGMA user_version").get()?.user_version).toBe(1);
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();
  expect(tables.length).toBe(23);
  expect(() =>
    db
      .prepare("INSERT INTO milestones VALUES (?,?,?,?)")
      .run("m", "missing", "{}", "now"),
  ).toThrow();
  db.close();
});
