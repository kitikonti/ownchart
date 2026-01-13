/**
 * Reusable Modal component with backdrop, focus trap, and keyboard support.
 *
 * Design: MS 365/Fluent UI inspired with Cyan brand color.
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop - MS Fluent: rgba(0,0,0,0.4), no blur */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog container - MS Fluent: 8px radius, specific shadow, 24px padding */}
      <div
        className={`
          relative bg-white rounded-lg ${widthClass} w-full max-h-[90vh] flex flex-col
          animate-modal-in
          shadow-[0_0_8px_rgba(0,0,0,0.12),0_32px_64px_rgba(0,0,0,0.14)]
        `}
      >
        {/* Header - MS style: no border, brand-colored title and close icon */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            {icon}
            <h2
              id="modal-title"
              className="text-xl font-semibold text-brand-600 leading-7"
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1.5 rounded hover:bg-neutral-100 transition-colors duration-100 text-brand-600 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
            aria-label="Close dialog"
          >
            <X size={20} weight="regular" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>

        {/* Footer - MS style: clean, no border, no background */}
        {footer && (
          <div className="px-6 pb-6 pt-2 flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
