import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACTIVITIES,
  DIFFICULTIES,
  MONTHS,
  TRIP_LENGTHS,
} from "./content";

/**
 * These UI-facing enum unions are hand-declared (they can't import the
 * server-only Prisma client). This test fails loudly if schema.prisma and the
 * UI ever drift apart — e.g. a Phase 2 activity added to the DB but not the UI.
 */

function schemaEnumMembers(enumName: string): string[] {
  const schema = readFileSync(
    join(process.cwd(), "prisma", "schema.prisma"),
    "utf8",
  );
  const match = schema.match(new RegExp(`enum ${enumName}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`enum ${enumName} not found in schema.prisma`);
  return match[1]
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trim()) // strip line comments
    .filter((line) => line.length > 0);
}

describe("shared enum unions stay in sync with prisma schema", () => {
  it.each([
    ["Activity", ACTIVITIES],
    ["Difficulty", DIFFICULTIES],
    ["TripLength", TRIP_LENGTHS],
    ["Month", MONTHS],
  ] as const)("%s matches", (enumName, uiValues) => {
    expect([...uiValues].sort()).toEqual(schemaEnumMembers(enumName).sort());
  });
});
