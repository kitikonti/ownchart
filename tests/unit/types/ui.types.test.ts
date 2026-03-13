/**
 * Unit tests for ui.types.ts.
 *
 * Verifies:
 * - `DropdownOption` accepts the expected shapes (compile-time checks via typed
 *   variable declarations; if the type is wrong, TypeScript will reject the file).
 * - The `disabled` optional field is recognised and structurally sound.
 * - Narrowed generic instantiations work as expected.
 *
 * There is no runtime logic to exercise — `DropdownOption` is a pure interface.
 * These tests serve as living documentation and compile-time regression guards.
 */

import { describe, it, expect } from "vitest";
import type { DropdownOption } from "@/types/ui.types";

describe("DropdownOption interface", () => {
  it("should accept a minimal option with value and label only", () => {
    const option: DropdownOption = { value: "task", label: "Task" };

    expect(option.value).toBe("task");
    expect(option.label).toBe("Task");
    expect(option.disabled).toBeUndefined();
  });

  it("should accept an option with disabled set to true", () => {
    const option: DropdownOption = {
      value: "milestone",
      label: "Milestone",
      disabled: true,
    };

    expect(option.disabled).toBe(true);
  });

  it("should accept an option with disabled set to false", () => {
    const option: DropdownOption = {
      value: "group",
      label: "Group",
      disabled: false,
    };

    expect(option.disabled).toBe(false);
  });

  it("should work with a narrowed string-literal generic parameter", () => {
    type TaskType = "task" | "milestone" | "group";

    const options: DropdownOption<TaskType>[] = [
      { value: "task", label: "Task" },
      { value: "milestone", label: "Milestone" },
      { value: "group", label: "Group", disabled: true },
    ];

    expect(options).toHaveLength(3);
    expect(options[0].value).toBe("task");
    expect(options[2].disabled).toBe(true);
  });

  it("should allow value to be used directly as a React key (string)", () => {
    const option: DropdownOption = { value: "some-option", label: "Some Option" };

    // `value` is constrained to string — confirm it is usable as a React key
    // without coercion. This is a runtime sanity check for the `T extends string`
    // constraint documented in the JSDoc.
    const key: string = option.value;
    expect(typeof key).toBe("string");
  });
});
