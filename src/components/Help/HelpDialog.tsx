/**
 * HelpDialog — main help dialog with tabs (Getting Started, Shortcuts, Features),
 * search, and comprehensive feature documentation.
 */

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { Question, Command } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { useUIStore } from "../../store/slices/uiSlice";
import {
  HELP_TABS,
  isMac,
  getModKey,
  type HelpTab,
  type HelpSection,
  type HelpTabId,
} from "../../config/helpContent";
import { useHelpSearch } from "../../hooks/useHelpSearch";
import { HelpSearchInput } from "./HelpSearchInput";
import { HelpSectionList } from "./HelpSectionList";
import { GettingStartedTab } from "./GettingStartedTab";

/**
 * Maximum height for the help dialog content area.
 * Sized to leave room for the search bar, tab strip, and footer within the modal.
 */
const CONTENT_MAX_HEIGHT = "max-h-[55vh]";

// ---------------------------------------------------------------------------
// Tab panel content — extracted to keep HelpDialog's return lean
// ---------------------------------------------------------------------------

interface HelpTabContentProps {
  isSearching: boolean;
  searchResults: HelpSection[];
  matchCount: number;
  query: string;
  activeTab: HelpTabId;
  currentTab: HelpTab;
  modKey: string;
}

const HelpTabContent = memo(function HelpTabContent({
  isSearching,
  searchResults,
  matchCount,
  query,
  activeTab,
  currentTab,
  modKey,
}: HelpTabContentProps): JSX.Element {
  if (isSearching) {
    if (searchResults.length > 0) {
      return (
        <>
          <p className="text-xs text-neutral-400 mb-3">
            {matchCount} result{matchCount !== 1 ? "s" : ""} for &ldquo;
            {query}&rdquo;
          </p>
          <HelpSectionList sections={searchResults} defaultOpen />
        </>
      );
    }
    return (
      <p className="text-sm text-neutral-400 text-center py-8">
        No results for &ldquo;{query}&rdquo;
      </p>
    );
  }

  if (activeTab === "getting-started") {
    return <GettingStartedTab sections={currentTab.sections} />;
  }

  if (activeTab === "shortcuts") {
    return (
      <>
        <HelpSectionList sections={currentTab.sections} compact defaultOpen />
        <div className="mt-4">
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
      </>
    );
  }

  // Features tab (default)
  return <HelpSectionList sections={currentTab.sections} />;
});

// ---------------------------------------------------------------------------
// HelpDialog
// ---------------------------------------------------------------------------

export function HelpDialog(): JSX.Element | null {
  const isOpen = useUIStore((state) => state.isHelpPanelOpen);
  const closeHelp = useUIStore((state) => state.closeHelpPanel);
  const activeTab = useUIStore((state) => state.helpDialogActiveTab);
  const setActiveTab = useUIStore((state) => state.setHelpDialogActiveTab);

  const [query, setQuery] = useState("");

  // Reset the search query whenever the dialog is closed so that reopening
  // it always shows a clean state instead of the previous search.
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const trimmedQuery = query.trim();
  const { sections: searchResults, matchCount } = useHelpSearch(
    HELP_TABS,
    query
  );
  const isSearching = trimmedQuery.length > 0;

  const foundTab = HELP_TABS.find((t) => t.id === activeTab);
  // HELP_TABS is a non-empty static array — HELP_TABS[0] is always defined.
  // The non-null assertion is safe here and avoids a spurious runtime branch.
  const currentTab = foundTab ?? HELP_TABS[0]!;

  // Warn developers (once per distinct invalid value) when the persisted
  // activeTab doesn't match any known tab — this can happen if a tab is
  // renamed or removed without updating the uiSlice default.
  // Placed in useEffect so it fires only when activeTab changes, not on
  // every render.
  useEffect(() => {
    if (import.meta.env.DEV && !foundTab) {
      console.warn(
        `[HelpDialog] Unknown activeTab "${activeTab}". Falling back to first tab.`
      );
    }
  }, [activeTab, foundTab]);

  // getModKey reads navigator.platform which never changes — compute once.
  const modKey = useMemo(() => getModKey(), []);

  const tablistRef = useRef<HTMLDivElement>(null);

  // WAI-ARIA tablist pattern: Arrow keys, Home, and End move between tabs and
  // keep DOM focus on the active tab button (roving tabIndex).
  const handleTablistKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      const currentIndex = HELP_TABS.findIndex((t) => t.id === activeTab);
      let nextIndex: number | null = null;

      if (e.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % HELP_TABS.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + HELP_TABS.length) % HELP_TABS.length;
      } else if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = HELP_TABS.length - 1;
      }

      if (nextIndex === null) return;
      e.preventDefault();
      setActiveTab(HELP_TABS[nextIndex].id);
      // Move DOM focus to the newly active tab button
      const tabButtons =
        tablistRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
      tabButtons?.[nextIndex]?.focus();
    },
    [activeTab, setActiveTab]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeHelp}
      title="Help"
      icon={<Question size={24} weight="light" className="text-neutral-500" />}
      widthClass="max-w-2xl"
      headerStyle="bordered"
      footerStyle="bordered"
      contentPadding="p-0"
      footer={
        <Button variant="primary" onClick={closeHelp}>
          Done
        </Button>
      }
    >
      {/* Search bar */}
      <div className="px-6 pt-5 pb-3">
        <HelpSearchInput value={query} onChange={setQuery} />
      </div>

      {/* Tab bar (hidden during search) */}
      {!isSearching && (
        <div
          ref={tablistRef}
          className="px-6 flex gap-1 border-b border-neutral-200"
          role="tablist"
          aria-label="Help navigation"
          tabIndex={0}
          onKeyDown={handleTablistKeyDown}
        >
          {HELP_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                  isActive
                    ? "text-brand-600"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`help-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content — role="tabpanel" when tabs are visible, plain div when searching */}
      <div
        className={`px-6 py-4 overflow-y-auto ${CONTENT_MAX_HEIGHT} scrollbar-thin`}
        role={!isSearching ? "tabpanel" : undefined}
        id={!isSearching ? `help-panel-${activeTab}` : undefined}
        aria-labelledby={!isSearching ? `tab-${activeTab}` : undefined}
        tabIndex={!isSearching ? 0 : undefined}
      >
        <HelpTabContent
          isSearching={isSearching}
          searchResults={searchResults}
          matchCount={matchCount}
          query={trimmedQuery}
          activeTab={activeTab}
          currentTab={currentTab}
          modKey={modKey}
        />
      </div>
    </Modal>
  );
}
