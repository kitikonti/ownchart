/**
 * Help Panel component displaying keyboard shortcuts.
 */

import { Question, Command } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { useUIStore } from "../../store/slices/uiSlice";

/**
 * Detect if the user is on a Mac.
 */
function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toLowerCase().includes("mac");
}

/**
 * Get the modifier key label based on platform.
 */
function getModifierKey(): string {
  return isMac() ? "Cmd" : "Ctrl";
}

interface ShortcutSection {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

/**
 * Get all keyboard shortcuts, with platform-appropriate modifier key.
 */
function getShortcuts(): ShortcutSection[] {
  const mod = getModifierKey();

  return [
    {
      title: "File Operations",
      shortcuts: [
        { keys: `${mod}+Alt+N`, description: "New chart" },
        { keys: `${mod}+O`, description: "Open file" },
        { keys: `${mod}+S`, description: "Save" },
        { keys: `${mod}+Shift+S`, description: "Save As" },
        { keys: `${mod}+E`, description: "Export to PNG" },
      ],
    },
    {
      title: "Edit Operations",
      shortcuts: [
        { keys: `${mod}+Z`, description: "Undo" },
        { keys: `${mod}+Shift+Z`, description: "Redo" },
        { keys: `${mod}+Y`, description: "Redo (alternative)" },
        { keys: `${mod}+C`, description: "Copy selected tasks" },
        { keys: `${mod}+X`, description: "Cut selected tasks" },
        { keys: `${mod}+V`, description: "Paste tasks" },
        { keys: `${mod}+A`, description: "Select all tasks" },
        { keys: `Delete / ${mod}+-`, description: "Delete selected tasks" },
        { keys: `${mod}++`, description: "Insert row(s) above" },
      ],
    },
    {
      title: "Selection",
      shortcuts: [
        { keys: "Click", description: "Select task" },
        { keys: `${mod}+Click`, description: "Add to selection" },
        { keys: "Shift+Click", description: "Range select" },
        { keys: "Drag (timeline)", description: "Marquee select" },
        { keys: "Escape", description: "Clear selection" },
      ],
    },
    {
      title: "Hierarchy",
      shortcuts: [
        { keys: "Alt+Shift+Right", description: "Indent task (make child)" },
        { keys: "Alt+Shift+Left", description: "Outdent task (make sibling)" },
      ],
    },
    {
      title: "View",
      shortcuts: [
        { keys: `${mod}+0`, description: "Reset zoom to 100%" },
        { keys: `${mod}+Wheel`, description: "Zoom at cursor" },
        { keys: "F", description: "Fit timeline to tasks" },
        { keys: "T", description: "Toggle today marker" },
        { keys: "D", description: "Toggle dependencies" },
        { keys: "P", description: "Toggle progress" },
        { keys: "H", description: "Toggle holidays" },
        {
          keys: "View > Columns",
          description: "Show/hide date columns",
        },
        {
          keys: "View > Table",
          description: "Collapse/expand task table",
        },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: "?", description: "Show this help" },
        { keys: "Escape", description: "Close dialog / Clear selection" },
      ],
    },
  ];
}

/**
 * Shortcut key badge component.
 */
function KeyBadge({ children }: { children: string }): JSX.Element {
  return (
    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-neutral-100 border border-neutral-200 rounded text-neutral-700 shadow-xs">
      {children}
    </kbd>
  );
}

/**
 * Parse a shortcut string and render with proper badges.
 */
function ShortcutKeys({ keys }: { keys: string }): JSX.Element {
  const parts = keys.split("+");

  return (
    <span className="flex items-center gap-1">
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-neutral-300 text-xs">+</span>}
          <KeyBadge>{part}</KeyBadge>
        </span>
      ))}
    </span>
  );
}

/**
 * Help Panel component.
 */
export function HelpPanel(): JSX.Element | null {
  const { isHelpPanelOpen, closeHelpPanel } = useUIStore();
  const shortcuts = getShortcuts();
  const modKey = isMac() ? "Cmd" : "Ctrl";

  const footer = (
    <Button variant="primary" onClick={closeHelpPanel}>
      Done
    </Button>
  );

  return (
    <Modal
      isOpen={isHelpPanelOpen}
      onClose={closeHelpPanel}
      title="Keyboard Shortcuts"
      icon={<Question size={24} weight="light" className="text-neutral-500" />}
      widthClass="max-w-xl"
      headerStyle="figma"
      footerStyle="figma"
      footer={footer}
    >
      <div className="space-y-6">
        {shortcuts.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2.5 pb-1.5 border-b border-neutral-200">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-sm text-neutral-600">
                    {shortcut.description}
                  </span>
                  <ShortcutKeys keys={shortcut.keys} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Tip */}
        <Alert variant="info">
          <span className="text-sm">
            {isMac() ? (
              <>
                <Command size={14} className="inline-block -mt-0.5" /> is the
                Command key on Mac.
              </>
            ) : (
              `Most shortcuts use ${modKey} as the modifier key.`
            )}
          </span>
        </Alert>
      </div>
    </Modal>
  );
}
