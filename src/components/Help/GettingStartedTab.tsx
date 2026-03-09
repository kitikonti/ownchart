/**
 * GettingStartedTab — 5 quick-start cards for new users.
 */

import { memo, useEffect } from "react";
import type { ReactNode, ReactElement } from "react";
import {
  Cursor,
  ArrowsOutCardinal,
  TreeStructure,
  FloppyDisk,
  Keyboard,
} from "@phosphor-icons/react";
import { type HelpSection, resolveShortcut } from "../../config/helpContent";

/**
 * Icon and background color mapping keyed by HelpTopic.id.
 * NOTE: These keys must stay in sync with the topic IDs defined in
 * helpContent.ts (getting-started sections). If a topic ID changes,
 * the corresponding entry here must be updated too — missing IDs fall
 * back to a default Cursor icon.
 */
const ICONS: Record<string, { icon: ReactNode; bg: string }> = {
  "gs-create-task": {
    icon: <Cursor size={20} className="text-brand-600" />,
    bg: "bg-brand-50",
  },
  "gs-move-tasks": {
    icon: <ArrowsOutCardinal size={20} className="text-emerald-600" />,
    bg: "bg-emerald-50",
  },
  "gs-hierarchy": {
    icon: <TreeStructure size={20} className="text-violet-600" />,
    bg: "bg-violet-50",
  },
  "gs-save-open": {
    icon: <FloppyDisk size={20} className="text-amber-600" />,
    bg: "bg-amber-50",
  },
  "gs-shortcuts": {
    icon: <Keyboard size={20} className="text-rose-600" />,
    bg: "bg-rose-50",
  },
};

interface GettingStartedTabProps {
  sections: HelpSection[];
}

function GettingStartedTabInner({
  sections,
}: GettingStartedTabProps): ReactElement {
  const topics = sections.flatMap((s) => s.topics);

  // Warn once per sections change (not on every render) about missing icon mappings.
  useEffect(() => {
    if (import.meta.env.DEV) {
      topics.forEach((topic) => {
        if (!ICONS[topic.id]) {
          console.warn(
            `[GettingStartedTab] No icon mapping found for topic id "${topic.id}". Add it to the ICONS map.`
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  return (
    <div className="space-y-3">
      {topics.map((topic) => {
        const visual = ICONS[topic.id];
        return (
          <div
            key={topic.id}
            className="flex items-start gap-3 p-3 bg-neutral-50 rounded border border-neutral-200"
          >
            <div
              className={`p-2 rounded flex-shrink-0 ${visual?.bg ?? "bg-neutral-100"}`}
            >
              {visual?.icon ?? (
                <Cursor size={20} className="text-neutral-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-neutral-800">
                {topic.title}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                {resolveShortcut(topic.description)}
              </p>
              {topic.tip && (
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                  {/* "Tip:" is announced once by screen readers via sr-only; visible label via aria-hidden. */}
                  <span className="sr-only">Tip: </span>
                  <span aria-hidden="true">Tip: </span>
                  {resolveShortcut(topic.tip)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Sections come from a stable config object, so memoizing prevents unnecessary
// re-renders when parent components (e.g. HelpPanel) re-render on search input.
export const GettingStartedTab = memo(GettingStartedTabInner);
