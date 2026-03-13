/**
 * HelpSectionList — renders a list of collapsible sections with topic cards.
 */

import { type ReactElement, useState, useEffect } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { type HelpSection } from "@/config/helpContent";
import { HelpTopicCard } from "./HelpTopicCard";

interface HelpSectionListProps {
  sections: HelpSection[];
  /** Render topics in compact shortcut-row style. */
  compact?: boolean;
  /** Open all sections by default (e.g. for search results). */
  defaultOpen?: boolean;
}

export function HelpSectionList({
  sections,
  compact = false,
  defaultOpen = false,
}: HelpSectionListProps): ReactElement {
  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <SectionAccordion
          key={section.id}
          section={section}
          compact={compact}
          defaultOpen={defaultOpen}
        />
      ))}
    </div>
  );
}

interface SectionAccordionProps {
  section: HelpSection;
  compact: boolean;
  defaultOpen: boolean;
}

function SectionAccordion({
  section,
  compact,
  defaultOpen,
}: SectionAccordionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = `help-section-panel-${section.id}`;

  // Sync open state when defaultOpen changes (e.g. when search results force
  // all sections open, or when search is cleared and they should close again).
  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <section>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between py-2.5 px-3 rounded hover:bg-neutral-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
      >
        <span className="text-sm font-semibold text-neutral-900">
          {section.title}
          <span
            className="ml-2 text-xs font-normal text-neutral-400"
            aria-hidden="true"
          >
            {section.topics.length}
          </span>
          <span className="sr-only"> ({section.topics.length} topics)</span>
        </span>
        <CaretDown
          className={`size-4 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          weight="bold"
          aria-hidden="true"
        />
      </button>

      <div id={panelId} hidden={!isOpen} className="pl-3 pr-1 pb-2">
        <div className="space-y-0.5">
          {section.topics.map((topic) => (
            <HelpTopicCard key={topic.id} topic={topic} compact={compact} />
          ))}
        </div>
      </div>
    </section>
  );
}
