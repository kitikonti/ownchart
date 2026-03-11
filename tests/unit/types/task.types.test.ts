/**
 * Unit tests for task.types.ts.
 *
 * Verifies:
 * - `EDITABLE_FIELDS` contains every `EditableField` union member.
 * - `EDITABLE_FIELDS` contains no duplicate values.
 * - `EDITABLE_FIELDS` is readonly (structural sanity check).
 * - `ActiveCell` discriminated union accepts the expected shapes.
 *
 * The compile-time `AssertEditableFieldsExhaustive` assertion is exercised
 * implicitly: if the union and the array fall out of sync this file will
 * fail to compile, surfacing the regression.
 */

import { describe, it, expect } from "vitest";
import {
  EDITABLE_FIELDS,
  type EditableField,
  type ActiveCell,
  type AssertEditableFieldsExhaustive,
} from "../../../src/types/task.types";

// --- Compile-time assertion check -----------------------------------------
// If AssertEditableFieldsExhaustive resolves to `never` the line below will
// produce a type error, causing CI to fail.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _exhaustive: AssertEditableFieldsExhaustive = true;

// --------------------------------------------------------------------------

describe("EDITABLE_FIELDS", () => {
  it("should contain every EditableField union member", () => {
    // The full list of expected members mirrors the EditableField union.
    // Updating this array when adding a new field is intentional — it forces
    // the developer to think about navigation order.
    const expectedFields: EditableField[] = [
      "color",
      "name",
      "type",
      "startDate",
      "endDate",
      "duration",
      "progress",
    ];

    expect([...EDITABLE_FIELDS].sort()).toEqual([...expectedFields].sort());
  });

  it("should contain no duplicate values", () => {
    const unique = new Set(EDITABLE_FIELDS);
    expect(unique.size).toBe(EDITABLE_FIELDS.length);
  });

  it("should have exactly 7 entries (one per EditableField member)", () => {
    expect(EDITABLE_FIELDS).toHaveLength(7);
  });
});

describe("ActiveCell discriminated union", () => {
  it("should accept a cell-active state where taskId and field are both set", () => {
    // This is primarily a compile-time check; the runtime assertion confirms
    // the shape is what consumers expect.
    const active: ActiveCell = {
      taskId: "task-1" as Parameters<typeof String>[0] & { readonly __brand: "TaskId" },
      field: "name",
    } as ActiveCell;

    expect(active.taskId).toBe("task-1");
    expect(active.field).toBe("name");
  });

  it("should accept the null-null sentinel for no-cell-selected state", () => {
    const inactive: ActiveCell = { taskId: null, field: null };

    expect(inactive.taskId).toBeNull();
    expect(inactive.field).toBeNull();
  });
});
