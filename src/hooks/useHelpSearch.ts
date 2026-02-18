/**
 * Search/filter hook for help content.
 * Tokenizes query and AND-matches against title, description, shortcuts, keywords.
 */

import { useMemo } from "react";
import {
  type HelpTab,
  type HelpSection,
  type HelpTopic,
  resolveShortcut,
} from "../config/helpContent";

export interface HelpSearchResult {
  /** Flat list of sections with matching topics (empty when query is empty). */
  sections: HelpSection[];
  /** Total number of matching topics. */
  matchCount: number;
}

/**
 * Filter help tabs by a search query.
 * Returns an empty sections array when query is blank (caller shows normal tabs).
 */
export function useHelpSearch(
  tabs: HelpTab[],
  query: string
): HelpSearchResult {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length === 0) {
      return { sections: [], matchCount: 0 };
    }

    const tokens = trimmed.split(/\s+/);
    const sections: HelpSection[] = [];
    let matchCount = 0;

    for (const tab of tabs) {
      for (const section of tab.sections) {
        const matchingTopics = section.topics.filter((topic) =>
          matchesTopic(topic, tokens)
        );
        if (matchingTopics.length > 0) {
          sections.push({ ...section, topics: matchingTopics });
          matchCount += matchingTopics.length;
        }
      }
    }

    return { sections, matchCount };
  }, [tabs, query]);
}

/** Check if a topic matches ALL tokens (AND logic). */
function matchesTopic(topic: HelpTopic, tokens: string[]): boolean {
  const haystack = buildHaystack(topic);
  return tokens.every((token) => haystack.includes(token));
}

/** Combine all searchable text into a single lowercase string. */
function buildHaystack(topic: HelpTopic): string {
  const parts = [topic.title, topic.description];
  if (topic.shortcuts) {
    parts.push(...topic.shortcuts.map(resolveShortcut));
  }
  if (topic.keywords) {
    parts.push(...topic.keywords);
  }
  if (topic.tip) {
    parts.push(topic.tip);
  }
  return parts.join(" ").toLowerCase();
}
