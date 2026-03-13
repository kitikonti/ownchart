import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHelpSearch } from "@/hooks/useHelpSearch";
import { HELP_TABS, getModKey } from "@/config/helpContent";

describe("useHelpSearch", () => {
  const tabs = HELP_TABS;

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
        topic.menuPath ?? "",
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

  it("should find topics by menuPath", () => {
    // "View > Columns" is the menuPath of the sc-columns topic.
    // Using the full phrase ensures the match comes exclusively from menuPath.
    const { result } = renderHook(() =>
      useHelpSearch(tabs, "View > Columns")
    );
    expect(result.current.matchCount).toBeGreaterThan(0);
    const allTopics = result.current.sections.flatMap((s) => s.topics);
    expect(allTopics.some((t) => t.id === "sc-columns")).toBe(true);
  });

  it("should find topics by resolved shortcut key (e.g. Ctrl/Cmd)", () => {
    // Shortcuts in helpContent use {mod} placeholders. buildHaystack calls
    // resolveShortcut() so users can search for the actual platform modifier
    // key ("Ctrl" on Windows/Linux, "Cmd" on macOS) rather than the raw token.
    const modKey = getModKey(); // "Ctrl" or "Cmd" depending on platform
    const { result } = renderHook(() => useHelpSearch(tabs, modKey));
    // There are many shortcuts that use {mod} — at least one topic must match.
    expect(result.current.matchCount).toBeGreaterThan(0);
  });
});
