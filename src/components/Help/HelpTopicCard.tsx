/**
 * HelpTopicCard — renders a single help topic with title, description,
 * keyboard shortcuts, and optional tip.
 */

import type { ReactElement } from "react";
import { Command } from "@phosphor-icons/react";
import {
  type HelpTopic,
  resolveShortcut,
  isMac,
} from "../../config/helpContent";

// ---------------------------------------------------------------------------
// KeyBadge / ShortcutKeys (extracted from old HelpPanel)
// ---------------------------------------------------------------------------

export function KeyBadge({ children }: { children: string }): ReactElement {
  return (
    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-neutral-100 border border-neutral-200 rounded text-neutral-700 shadow-xs">
      {children}
    </kbd>
  );
}

/** Renders a UI navigation path (e.g. "View > Columns") as a breadcrumb. */
export function MenuPathLabel({ path }: { path: string }): ReactElement {
  const parts = path.split(" > ");
  return (
    <span className="text-xs text-neutral-400 flex items-center gap-0.5 flex-shrink-0">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} className="flex items-center gap-0.5">
          {i > 0 && (
            <span className="mx-0.5" aria-hidden="true">
              ›
            </span>
          )}
          <span>{part}</span>
        </span>
      ))}
    </span>
  );
}

export function ShortcutKeys({ keys }: { keys: string }): ReactElement {
  const resolved = resolveShortcut(keys);
  const parts = resolved.split("+");

  return (
    // aria-label gives screen readers a clean announcement of the full shortcut
    // (e.g. "Ctrl+S") instead of reading each <kbd> element individually.
    <span
      className="flex items-center gap-1 flex-shrink-0"
      aria-label={resolved}
    >
      {parts.map((part, index) => (
        <span
          key={`${part.trim()}-${index}`}
          className="flex items-center gap-1"
          aria-hidden="true"
        >
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
}: HelpTopicCardProps): ReactElement {
  if (compact) {
    return (
      <div className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-neutral-50 transition-colors">
        <span className="text-sm text-neutral-600">{topic.description}</span>
        {topic.shortcuts && topic.shortcuts.length > 0 ? (
          <ShortcutKeys keys={topic.shortcuts[0]} />
        ) : topic.menuPath ? (
          <MenuPathLabel path={topic.menuPath} />
        ) : null}
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
        {(topic.shortcuts && topic.shortcuts.length > 0) || topic.menuPath ? (
          <div className="flex flex-col items-end gap-1 mt-0.5">
            {topic.shortcuts?.map((sc) => (
              <ShortcutKeys key={sc} keys={sc} />
            ))}
            {topic.menuPath && <MenuPathLabel path={topic.menuPath} />}
          </div>
        ) : null}
      </div>
      {topic.tip && (
        <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
          {/* "Tip:" is announced once by screen readers via sr-only; visible via aria-hidden.
              On macOS with a {mod} shortcut the ⌘ Command icon is added as an extra
              visual cue — its positioning comes after the shared "Tip:" prefix. */}
          <span className="sr-only">Tip: </span>
          <span aria-hidden="true">Tip: </span>
          {isMac() && topic.tip.includes("{mod}") ? (
            // On macOS, show the Command icon as a visual cue alongside the tip text.
            // resolveShortcut replaces {mod} with "Cmd".
            <>
              <Command
                size={11}
                className="inline-block flex-shrink-0"
                aria-hidden="true"
              />
              {resolveShortcut(topic.tip)}
            </>
          ) : (
            resolveShortcut(topic.tip)
          )}
        </p>
      )}
    </div>
  );
}
