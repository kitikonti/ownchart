import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  HELP_TABS,
  MOD_PLACEHOLDER,
  isMac,
  getModKey,
  resolveShortcut,
  resolveHelpTopic,
  type HelpTab,
  type HelpTopic,
} from "@/config/helpContent";

// ---------------------------------------------------------------------------
// isMac
// ---------------------------------------------------------------------------

describe("isMac", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return false when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isMac()).toBe(false);
  });

  it("should return true for a macOS user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    });
    expect(isMac()).toBe(true);
  });

  it("should return false for a Windows user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });
    expect(isMac()).toBe(false);
  });

  it("should return false for a Linux user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    });
    expect(isMac()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getModKey
// ---------------------------------------------------------------------------

describe("getModKey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return Cmd on macOS", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    });
    expect(getModKey()).toBe("Cmd");
  });

  it("should return Ctrl on non-Mac", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });
    expect(getModKey()).toBe("Ctrl");
  });

  it("should return Ctrl when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(getModKey()).toBe("Ctrl");
  });
});

// ---------------------------------------------------------------------------
// resolveShortcut
// ---------------------------------------------------------------------------

describe("resolveShortcut", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should replace {mod} with Ctrl on non-Mac", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
    expect(resolveShortcut(`${MOD_PLACEHOLDER}+S`)).toBe("Ctrl+S");
  });

  it("should replace {mod} with Cmd on Mac", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    });
    expect(resolveShortcut(`${MOD_PLACEHOLDER}+S`)).toBe("Cmd+S");
  });

  it("should replace multiple {mod} occurrences in one string", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
    expect(
      resolveShortcut(`${MOD_PLACEHOLDER}+${MOD_PLACEHOLDER}`),
    ).toBe("Ctrl+Ctrl");
  });

  it("should leave strings without {mod} unchanged", () => {
    expect(resolveShortcut("Shift+Click")).toBe("Shift+Click");
    expect(resolveShortcut("Escape")).toBe("Escape");
    expect(resolveShortcut("F")).toBe("F");
  });

  it("should handle empty string", () => {
    expect(resolveShortcut("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// resolveHelpTopic
// ---------------------------------------------------------------------------

describe("resolveHelpTopic", () => {
  beforeEach(() => {
    // Use non-Mac so {mod} → Ctrl for predictable assertions.
    // beforeEach (not beforeAll) because afterEach clears all stubs after
    // each test, so the stub must be re-applied before the next one.
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should resolve {mod} in description", () => {
    const topic: HelpTopic = {
      id: "test",
      title: "Test",
      description: `Press ${MOD_PLACEHOLDER}+S to save.`,
    };
    expect(resolveHelpTopic(topic).description).toBe("Press Ctrl+S to save.");
  });

  it("should resolve {mod} in tip when present", () => {
    const topic: HelpTopic = {
      id: "test",
      title: "Test",
      description: "No mod here.",
      tip: `Use ${MOD_PLACEHOLDER}+Z to undo.`,
    };
    expect(resolveHelpTopic(topic).tip).toBe("Use Ctrl+Z to undo.");
  });

  it("should include tip key when tip is an empty string", () => {
    const topic: HelpTopic = {
      id: "test",
      title: "Test",
      description: "desc",
      tip: "",
    };
    // tip: "" is a valid value (not undefined), so the key must be present
    expect("tip" in resolveHelpTopic(topic)).toBe(true);
    expect(resolveHelpTopic(topic).tip).toBe("");
  });

  it("should omit tip key when tip is undefined", () => {
    const topic: HelpTopic = {
      id: "test",
      title: "Test",
      description: "No tip.",
    };
    expect("tip" in resolveHelpTopic(topic)).toBe(false);
  });

  it("should resolve {mod} in shortcuts array", () => {
    const topic: HelpTopic = {
      id: "test",
      title: "Test",
      description: "desc",
      shortcuts: [
        `${MOD_PLACEHOLDER}+S`,
        `${MOD_PLACEHOLDER}+Shift+S`,
      ],
    };
    expect(resolveHelpTopic(topic).shortcuts).toEqual([
      "Ctrl+S",
      "Ctrl+Shift+S",
    ]);
  });

  it("should handle empty shortcuts array without dropping the key", () => {
    const topic: HelpTopic = {
      id: "test",
      title: "Test",
      description: "desc",
      shortcuts: [],
    };
    const resolved = resolveHelpTopic(topic);
    expect("shortcuts" in resolved).toBe(true);
    expect(resolved.shortcuts).toEqual([]);
  });

  it("should omit shortcuts key when shortcuts is undefined", () => {
    const topic: HelpTopic = {
      id: "test",
      title: "Test",
      description: "desc",
    };
    expect("shortcuts" in resolveHelpTopic(topic)).toBe(false);
  });

  it("should preserve all other topic fields unchanged", () => {
    const topic: HelpTopic = {
      id: "my-id",
      title: "My Title",
      description: "desc",
      keywords: ["a", "b"],
    };
    const resolved = resolveHelpTopic(topic);
    expect(resolved.id).toBe("my-id");
    expect(resolved.title).toBe("My Title");
    expect(resolved.keywords).toEqual(["a", "b"]);
  });

  it("should not mutate the original topic", () => {
    const topic: HelpTopic = {
      id: "test",
      title: "Test",
      description: "Press {mod}+S.",
      shortcuts: ["{mod}+S"],
    };
    resolveHelpTopic(topic);
    expect(topic.description).toBe("Press {mod}+S.");
    expect(topic.shortcuts).toEqual(["{mod}+S"]);
  });
});

// ---------------------------------------------------------------------------
// getHelpTabs — structural integrity
// ---------------------------------------------------------------------------

describe("helpContent", () => {
  const tabs: readonly HelpTab[] = HELP_TABS;

  it("should have exactly 3 tabs", () => {
    expect(tabs).toHaveLength(3);
    expect(tabs.map((t) => t.id)).toEqual([
      "getting-started",
      "shortcuts",
      "features",
    ]);
  });

  it("should have labels for all tabs", () => {
    for (const tab of tabs) {
      expect(tab.label).toBeTruthy();
    }
  });

  it("should have no empty sections", () => {
    for (const tab of tabs) {
      expect(tab.sections.length).toBeGreaterThan(0);
      for (const section of tab.sections) {
        expect(section.topics.length).toBeGreaterThan(0);
      }
    }
  });

  it("should have unique topic IDs across all tabs", () => {
    const ids = new Set<string>();
    for (const tab of tabs) {
      for (const section of tab.sections) {
        for (const topic of section.topics) {
          expect(ids.has(topic.id)).toBe(false);
          ids.add(topic.id);
        }
      }
    }
  });

  it("should have unique section IDs across all tabs", () => {
    const ids = new Set<string>();
    for (const tab of tabs) {
      for (const section of tab.sections) {
        expect(ids.has(section.id)).toBe(false);
        ids.add(section.id);
      }
    }
  });

  it("should have non-empty title and description for every topic", () => {
    const allTopics: HelpTopic[] = [];
    for (const tab of tabs) {
      for (const section of tab.sections) {
        allTopics.push(...section.topics);
      }
    }

    for (const topic of allTopics) {
      expect(topic.title.trim().length).toBeGreaterThan(0);
      expect(topic.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("should have icons for all sections", () => {
    for (const tab of tabs) {
      for (const section of tab.sections) {
        expect(section.icon).toBeTruthy();
      }
    }
  });

  it("should export MOD_PLACEHOLDER as the {mod} literal", () => {
    expect(MOD_PLACEHOLDER).toBe("{mod}");
  });

  describe("Getting Started tab", () => {
    it("should have 5 topics", () => {
      const gsTab = tabs.find((t) => t.id === "getting-started")!;
      const topics = gsTab.sections.flatMap((s) => s.topics);
      expect(topics).toHaveLength(5);
    });
  });

  describe("Shortcuts tab", () => {
    it("should have 6 sections", () => {
      const scTab = tabs.find((t) => t.id === "shortcuts")!;
      expect(scTab.sections).toHaveLength(6);
    });

    it("should have shortcuts or menuPath defined for every topic", () => {
      const scTab = tabs.find((t) => t.id === "shortcuts")!;
      for (const section of scTab.sections) {
        for (const topic of section.topics) {
          const hasShortcuts =
            topic.shortcuts !== undefined && topic.shortcuts.length > 0;
          const hasMenuPath =
            topic.menuPath !== undefined && topic.menuPath.length > 0;
          expect(
            hasShortcuts || hasMenuPath,
            `topic "${topic.id}" must have shortcuts or menuPath`,
          ).toBe(true);
        }
      }
    });

    it("should have unique shortcut strings across all topics", () => {
      const scTab = tabs.find((t) => t.id === "shortcuts")!;
      const allKeys: string[] = [];
      for (const section of scTab.sections) {
        for (const topic of section.topics) {
          allKeys.push(...(topic.shortcuts ?? []));
        }
      }
      const uniqueKeys = new Set(allKeys);
      expect(uniqueKeys.size).toBe(allKeys.length);
    });
  });

  describe("Features tab", () => {
    it("should have 17 sections", () => {
      const fTab = tabs.find((t) => t.id === "features")!;
      expect(fTab.sections).toHaveLength(17);
    });

    it("should have at least 60 feature topics total", () => {
      const fTab = tabs.find((t) => t.id === "features")!;
      const topicCount = fTab.sections.reduce(
        (sum, s) => sum + s.topics.length,
        0
      );
      expect(topicCount).toBeGreaterThanOrEqual(60);
    });
  });

  describe("shortcut placeholders", () => {
    it("should use {mod} placeholder (not hardcoded Ctrl/Cmd)", () => {
      for (const tab of tabs) {
        for (const section of tab.sections) {
          for (const topic of section.topics) {
            if (topic.shortcuts) {
              for (const sc of topic.shortcuts) {
                expect(sc).not.toMatch(/\bCtrl\b/);
                expect(sc).not.toMatch(/\bCmd\b/);
              }
            }
          }
        }
      }
    });
  });
});
