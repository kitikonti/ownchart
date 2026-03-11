import { describe, it, expect } from "vitest";
import { hasSameTaskIds } from "../../../../src/utils/clipboard/compare";
import { tid } from "../../../helpers/branded";

describe("hasSameTaskIds", () => {
  it("should return true for two empty arrays", () => {
    expect(hasSameTaskIds([], [])).toBe(true);
  });

  it("should return true when both arrays contain the same single ID", () => {
    expect(hasSameTaskIds([{ id: tid("t1") }], [{ id: tid("t1") }])).toBe(
      true
    );
  });

  it("should return true when both arrays have the same IDs in the same order", () => {
    const a = [{ id: tid("t1") }, { id: tid("t2") }, { id: tid("t3") }];
    const b = [{ id: tid("t1") }, { id: tid("t2") }, { id: tid("t3") }];
    expect(hasSameTaskIds(a, b)).toBe(true);
  });

  it("should return false when arrays have the same IDs in different order", () => {
    const a = [{ id: tid("t1") }, { id: tid("t2") }];
    const b = [{ id: tid("t2") }, { id: tid("t1") }];
    expect(hasSameTaskIds(a, b)).toBe(false);
  });

  it("should return false when arrays have different lengths (a longer)", () => {
    const a = [{ id: tid("t1") }, { id: tid("t2") }];
    const b = [{ id: tid("t1") }];
    expect(hasSameTaskIds(a, b)).toBe(false);
  });

  it("should return false when arrays have different lengths (b longer)", () => {
    const a = [{ id: tid("t1") }];
    const b = [{ id: tid("t1") }, { id: tid("t2") }];
    expect(hasSameTaskIds(a, b)).toBe(false);
  });

  it("should return false when arrays have the same length but different IDs", () => {
    const a = [{ id: tid("t1") }, { id: tid("t2") }];
    const b = [{ id: tid("t1") }, { id: tid("t3") }];
    expect(hasSameTaskIds(a, b)).toBe(false);
  });

  it("should return false when one array is empty and the other is not", () => {
    expect(hasSameTaskIds([], [{ id: tid("t1") }])).toBe(false);
    expect(hasSameTaskIds([{ id: tid("t1") }], [])).toBe(false);
  });

  it("should accept readonly arrays without requiring mutable arrays", () => {
    const a: readonly { id: ReturnType<typeof tid> }[] = [{ id: tid("t1") }];
    const b: readonly { id: ReturnType<typeof tid> }[] = [{ id: tid("t1") }];
    expect(hasSameTaskIds(a, b)).toBe(true);
  });
});
