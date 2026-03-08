/**
 * Reusable Modal component with backdrop, focus trap, and keyboard support.
 *
 * Design: MS 365/Fluent UI inspired with Outlook Blue brand color.
 */

import {
  useEffect,
  useRef,
  useId,
  useCallback,
  memo,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { SHADOWS } from "../../styles/design-tokens";

/**
 * Tailwind class that constrains the dialog height — prevents the modal from
 * overflowing the viewport on short screens while still allowing internal scrolling.
 */
const DIALOG_MAX_HEIGHT_CLASS = "max-h-[90vh]";

/**
 * Tailwind class maps for header/footer style variants.
 * Centralised here so adding a new variant only requires one change.
 */
const HEADER_STYLE_CLASSES: Record<"default" | "bordered", string> = {
  default: "p-6 pb-0",
  bordered: "px-8 py-6 border-b border-neutral-200",
} as const;

const HEADER_TITLE_CLASSES: Record<"default" | "bordered", string> = {
  default: "text-xl text-brand-600",
  bordered: "text-xl text-neutral-900",
} as const;

const FOOTER_STYLE_CLASSES: Record<"default" | "bordered", string> = {
  default: "px-6 pb-6 pt-2 flex justify-end gap-2",
  bordered:
    "px-8 py-6 border-t border-neutral-200 bg-neutral-50 rounded-b flex justify-end gap-3",
} as const;

/**
 * Selector for all focusable, non-disabled elements within the modal.
 * Defined at module level to avoid re-creating the string on every render.
 */
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Called when the modal should close */
  onClose: () => void;

  /** Modal title */
  title: string;

  /** Optional subtitle below the title — also used as the dialog's accessible description */
  subtitle?: string;

  /** Modal content */
  children: ReactNode;

  /** Optional icon to display next to the title */
  icon?: ReactNode;

  /** Optional footer content */
  footer?: ReactNode;

  /** Modal width class (default: max-w-lg) */
  widthClass?: string;

  /** Header style: "default" = flush, "bordered" = border-bottom (Fluent-style) */
  headerStyle?: "default" | "bordered";

  /** Footer style: "default" = minimal, "bordered" = border-top with bg-neutral-50 */
  footerStyle?: "default" | "bordered";

  /** Custom padding for content area */
  contentPadding?: string;
}

/**
 * Modal component with backdrop and focus management.
 */
export const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  icon,
  footer,
  widthClass = "max-w-lg",
  headerStyle = "default",
  footerStyle = "default",
  contentPadding = "p-6",
}: ModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Generate stable, instance-unique IDs so that multiple modals mounted
  // simultaneously (e.g. during animations) never share the same ARIA IDs.
  const instanceId = useId();
  const titleId = `modal-title-${instanceId}`;
  const subtitleId = `modal-subtitle-${instanceId}`;

  // Save the focused element before opening; restore it when the modal closes
  // or when the component unmounts (e.g. parent removed from tree while open).
  // Guard the restore with a null check and reset after use to prevent
  // double-focus or focus on a stale/unmounted element.
  //
  // Focus strategy: we focus the dialog root (tabIndex={-1}) rather than the
  // first focusable child. This is a deliberate trade-off — it prevents
  // accidentally activating a destructive button (e.g. "Delete") the moment
  // the modal opens, and it allows callers (like HelpDialog) to control which
  // element receives initial focus via autoFocus or explicit focus calls.
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
      return () => {
        // Restore focus on close (isOpen → false) OR on unmount while open.
        // Capture and null the ref before calling focus() so that even if
        // .focus() throws, the ref is not left pointing at a stale element.
        const elToRestore = previousActiveElement.current;
        previousActiveElement.current = null;
        elToRestore?.focus();
      };
    }
  }, [isOpen]);

  // Handle keyboard events.
  // onKeyDown is placed on the dialog root (role="dialog") intentionally:
  // this is the standard pattern for modal keyboard handling — the dialog
  // element is the focus container and needs to intercept Tab and Escape.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }

      // Focus trap: keep focus inside the modal while it is open.
      // querySelectorAll is intentionally called on every Tab keypress rather
      // than cached — this correctly handles modals with dynamic children
      // (conditionally rendered buttons, tabs switching content, etc.).
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

        // Guard: if there are no focusable elements, absorb Tab to prevent
        // focus from escaping the modal (e.g. content-only dialogs).
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [onClose]
  );

  if (!isOpen) {
    return null;
  }

  return createPortal(
    // The dialog root captures keyboard events for Escape + focus-trap (Tab).
    // role="dialog" with tabIndex={-1} is the standard WAI-ARIA modal pattern;
    // jsx-a11y misclassifies it as non-interactive because it isn't a widget role.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={modalRef}
      className="fixed inset-0 flex items-center justify-center p-4 z-[1100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop - MS Fluent: rgba(0,0,0,0.4), no blur.
          tabIndex={-1} keeps it non-focusable; aria-hidden hides it from the
          SR tree. Click-dismiss is intentional UX (keyboard users use Escape). */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* Dialog container - Outlook style: 4px radius, Fluent shadow */}
      <div
        className={`
          relative bg-white rounded overflow-hidden ${widthClass} w-full ${DIALOG_MAX_HEIGHT_CLASS} flex flex-col
          animate-modal-in
        `}
        style={{ boxShadow: SHADOWS.modal }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between ${HEADER_STYLE_CLASSES[headerStyle]}`}
        >
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h2
                id={titleId}
                className={`font-semibold leading-7 ${HEADER_TITLE_CLASSES[headerStyle]}`}
              >
                {title}
              </h2>
              {subtitle && (
                <p id={subtitleId} className="text-sm text-neutral-500 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1.5 rounded-sm text-neutral-500 hover:text-neutral-700 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`Close ${title}`}
          >
            <X size={20} weight="regular" />
          </button>
        </div>

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto ${contentPadding} scrollbar-thin`}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={FOOTER_STYLE_CLASSES[footerStyle]}>{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
});
