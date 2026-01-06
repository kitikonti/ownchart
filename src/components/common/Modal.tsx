/**
 * Reusable Modal component with backdrop, focus trap, and keyboard support.
 */

import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import { X } from "@phosphor-icons/react";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Called when the modal should close */
  onClose: () => void;

  /** Modal title */
  title: string;

  /** Modal content */
  children: ReactNode;

  /** Optional icon to display next to the title */
  icon?: ReactNode;

  /** Optional footer content */
  footer?: ReactNode;

  /** Modal width class (default: max-w-lg) */
  widthClass?: string;
}

/**
 * Modal component with backdrop and focus management.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  icon,
  footer,
  widthClass = "max-w-lg",
}: ModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Save the previously focused element and focus the modal
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    }

    return () => {
      // Restore focus when modal closes
      if (previousActiveElement.current && !isOpen) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }

    // Focus trap
    if (e.key === "Tab" && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop - clickable to close with blur effect */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`
          relative bg-white rounded-xl shadow-xl ${widthClass} w-full max-h-[90vh] flex flex-col
          animate-modal-in
          ring-1 ring-slate-200/50
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            {icon}
            <h2
              id="modal-title"
              className="text-lg font-semibold text-slate-900 tracking-tight"
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            aria-label="Close dialog"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
