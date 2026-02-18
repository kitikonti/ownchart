/**
 * GettingStartedTab — 5 quick-start cards for new users.
 */

import {
  Cursor,
  ArrowsOutCardinal,
  TreeStructure,
  FloppyDisk,
  Keyboard,
} from "@phosphor-icons/react";
import { type HelpSection, resolveShortcut } from "../../config/helpContent";

const ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
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

export function GettingStartedTab({
  sections,
}: GettingStartedTabProps): JSX.Element {
  const topics = sections.flatMap((s) => s.topics);

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
              <p className="text-sm font-medium text-neutral-800">
                {topic.title}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                {resolveShortcut(topic.description)}
              </p>
              {topic.tip && (
                <p className="text-xs text-neutral-400 mt-1">
                  Tip: {resolveShortcut(topic.tip)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
