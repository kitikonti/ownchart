/**
 * Search/filter hook for help content.
 * Tokenizes query and AND-matches against title, description, shortcuts, keywords.
 *
 * The query is deferred via React 18's useDeferredValue so that rapid keystrokes
 * do not block the input — the search computation runs at lower priority and
 * the UI stays responsive even for large help corpora.
 */

import { useMemo, useDeferredValue } from "react";
import type { HelpTab, HelpSection, HelpTopic } from "../config/helpContent";
import { resolveShortcut } from "../config/helpContent";

export interface HelpSearchResult {
  /** Flat list of sections with matching topics (empty when query is empty). */
  sections: HelpSection[];
  /** Total number of matching topics. */
  matchCount: number;
}

/**
 * Filter help tabs by a search query.
 * Returns an empty sections array when query is blank (caller shows normal tabs).
 * The query is internally deferred so typing stays snappy.
 *
 * @param tabs - **Must be a stable reference** (e.g. a module-level constant like
 *   `HELP_TABS`). Passing an inline array literal or re-constructed array on every
 *   render will bust the internal `useMemo` on every keystroke, defeating the
 *   deferred-value optimisation.
 * @param query - Raw search string from the user (trimming and lowercasing are
 *   handled internally).
 */
export function useHelpSearch(
  tabs: readonly HelpTab[],
  query: string
): HelpSearchResult {
  // Defer the search computation so rapid keystrokes don't block the input field.
  const deferredQuery = useDeferredValue(query);

  return useMemo(() => {
    const trimmed = deferredQuery.trim().toLowerCase();
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
  }, [tabs, deferredQuery]);
}

/** Check if a topic matches ALL tokens (AND logic). */
function matchesTopic(topic: HelpTopic, tokens: string[]): boolean {
  const haystack = buildHaystack(topic);
  return tokens.every((token): boolean => haystack.includes(token));
}

/** Combine all searchable text into a single lowercase string. */
function buildHaystack(topic: HelpTopic): string {
  const parts = [topic.title, topic.description];
  if (topic.shortcuts) {
    parts.push(...topic.shortcuts.map(resolveShortcut));
  }
  if (topic.menuPath) {
    parts.push(topic.menuPath);
  }
  if (topic.keywords) {
    parts.push(...topic.keywords);
  }
  if (topic.tip) {
    parts.push(topic.tip);
  }
  return parts.join(" ").toLowerCase();
}
