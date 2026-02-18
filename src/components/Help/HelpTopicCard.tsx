/**
 * HelpTopicCard — renders a single help topic with title, description,
 * keyboard shortcuts, and optional tip.
 */

import { Command } from "@phosphor-icons/react";
import {
  type HelpTopic,
  resolveShortcut,
  isMac,
} from "../../config/helpContent";

// ---------------------------------------------------------------------------
// KeyBadge / ShortcutKeys (extracted from old HelpPanel)
// ---------------------------------------------------------------------------

export function KeyBadge({ children }: { children: string }): JSX.Element {
  return (
    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-neutral-100 border border-neutral-200 rounded text-neutral-700 shadow-xs">
      {children}
    </kbd>
  );
}

export function ShortcutKeys({ keys }: { keys: string }): JSX.Element {
  const resolved = resolveShortcut(keys);
  const parts = resolved.split("+");

  return (
    <span className="flex items-center gap-1 flex-shrink-0">
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-neutral-300 text-xs">+</span>}
          <KeyBadge>{part.trim()}</KeyBadge>
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// HelpTopicCard
// ---------------------------------------------------------------------------

interface HelpTopicCardProps {
  topic: HelpTopic;
  /** When true, renders a compact row (used in shortcuts tab). */
  compact?: boolean;
}

export function HelpTopicCard({
  topic,
  compact = false,
}: HelpTopicCardProps): JSX.Element {
  if (compact) {
    return (
      <div className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-neutral-50 transition-colors">
        <span className="text-sm text-neutral-600">{topic.description}</span>
        {topic.shortcuts && topic.shortcuts.length > 0 && (
          <ShortcutKeys keys={topic.shortcuts[0]} />
        )}
      </div>
    );
  }

  return (
    <div className="py-2.5 px-3 -mx-3 rounded hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-neutral-900">
            {topic.title}
          </h4>
          <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">
            {resolveShortcut(topic.description)}
          </p>
        </div>
        {topic.shortcuts && topic.shortcuts.length > 0 && (
          <div className="flex flex-col items-end gap-1 mt-0.5">
            {topic.shortcuts.map((sc) => (
              <ShortcutKeys key={sc} keys={sc} />
            ))}
          </div>
        )}
      </div>
      {topic.tip && (
        <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
          {isMac() && topic.tip.includes("{mod}") ? (
            <>
              <Command size={11} className="inline-block flex-shrink-0" />
              {resolveShortcut(topic.tip)}
            </>
          ) : (
            <>Tip: {resolveShortcut(topic.tip)}</>
          )}
        </p>
      )}
    </div>
  );
}
