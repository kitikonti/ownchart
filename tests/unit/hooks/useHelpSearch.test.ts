import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHelpSearch } from "../../../src/hooks/useHelpSearch";
import { getHelpTabs } from "../../../src/config/helpContent";

describe("useHelpSearch", () => {
  const tabs = getHelpTabs();

  it("should return empty results for empty query", () => {
    const { result } = renderHook(() => useHelpSearch(tabs, ""));
    expect(result.current.sections).toHaveLength(0);
    expect(result.current.matchCount).toBe(0);
  });

  it("should return empty results for whitespace query", () => {
    const { result } = renderHook(() => useHelpSearch(tabs, "   "));
    expect(result.current.sections).toHaveLength(0);
    expect(result.current.matchCount).toBe(0);
  });

  it("should find topics by title", () => {
    const { result } = renderHook(() => useHelpSearch(tabs, "undo"));
    expect(result.current.matchCount).toBeGreaterThan(0);
    const allTopics = result.current.sections.flatMap((s) => s.topics);
    expect(allTopics.some((t) => t.title.toLowerCase().includes("undo"))).toBe(
      true
    );
  });

  it("should find topics by description", () => {
    const { result } = renderHook(() => useHelpSearch(tabs, "clipboard"));
    expect(result.current.matchCount).toBeGreaterThan(0);
  });

  it("should find topics by keywords", () => {
    const { result } = renderHook(() => useHelpSearch(tabs, "lasso"));
    expect(result.current.matchCount).toBeGreaterThan(0);
    const allTopics = result.current.sections.flatMap((s) => s.topics);
    expect(allTopics.some((t) => t.id === "feat-sel-marquee")).toBe(true);
  });

  it("should AND-match multiple tokens", () => {
    const { result } = renderHook(() => useHelpSearch(tabs, "zoom cursor"));
    expect(result.current.matchCount).toBeGreaterThan(0);
    // Each matching topic should contain both "zoom" and "cursor" somewhere
    const allTopics = result.current.sections.flatMap((s) => s.topics);
    for (const topic of allTopics) {
      const haystack = [
        topic.title,
        topic.description,
        ...(topic.shortcuts ?? []),
        ...(topic.keywords ?? []),
        topic.tip ?? "",
      ]
        .join(" ")
        .toLowerCase();
      expect(haystack).toContain("zoom");
      expect(haystack).toContain("cursor");
    }
  });

  it("should return no results for nonsense query", () => {
    const { result } = renderHook(() =>
      useHelpSearch(tabs, "xyzzyfoobarbaz123")
    );
    expect(result.current.matchCount).toBe(0);
    expect(result.current.sections).toHaveLength(0);
  });

  it("should be case-insensitive", () => {
    const { result: lower } = renderHook(() => useHelpSearch(tabs, "save"));
    const { result: upper } = renderHook(() => useHelpSearch(tabs, "SAVE"));
    expect(lower.current.matchCount).toBe(upper.current.matchCount);
  });

  it("should group results by section", () => {
    const { result } = renderHook(() => useHelpSearch(tabs, "save"));
    for (const section of result.current.sections) {
      expect(section.topics.length).toBeGreaterThan(0);
      expect(section.id).toBeTruthy();
      expect(section.title).toBeTruthy();
    }
  });
});
