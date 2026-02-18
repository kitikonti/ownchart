import { describe, it, expect } from "vitest";
import { getHelpTabs, type HelpTab, type HelpTopic } from "../../../src/config/helpContent";

describe("helpContent", () => {
  let tabs: HelpTab[];

  beforeAll(() => {
    tabs = getHelpTabs();
  });

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

    it("should have shortcuts defined for every topic", () => {
      const scTab = tabs.find((t) => t.id === "shortcuts")!;
      for (const section of scTab.sections) {
        for (const topic of section.topics) {
          expect(topic.shortcuts).toBeDefined();
          expect(topic.shortcuts!.length).toBeGreaterThan(0);
        }
      }
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
