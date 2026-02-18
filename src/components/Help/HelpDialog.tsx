/**
 * HelpDialog — main help dialog with tabs (Getting Started, Shortcuts, Features),
 * search, and comprehensive feature documentation.
 */

import { useState, useMemo } from "react";
import { Question, Command } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { useUIStore } from "../../store/slices/uiSlice";
import {
  type HelpTabId,
  getHelpTabs,
  isMac,
  getModKey,
} from "../../config/helpContent";
import { useHelpSearch } from "../../hooks/useHelpSearch";
import { HelpSearchInput } from "./HelpSearchInput";
import { HelpSectionList } from "./HelpSectionList";
import { GettingStartedTab } from "./GettingStartedTab";

const TAB_IDS: HelpTabId[] = ["getting-started", "shortcuts", "features"];

export function HelpDialog(): JSX.Element | null {
  const isOpen = useUIStore((state) => state.isHelpPanelOpen);
  const closeHelp = useUIStore((state) => state.closeHelpPanel);
  const activeTab = useUIStore((state) => state.helpDialogActiveTab);
  const setActiveTab = useUIStore((state) => state.setHelpDialogActiveTab);

  const [query, setQuery] = useState("");

  const tabs = useMemo(() => getHelpTabs(), []);
  const { sections: searchResults, matchCount } = useHelpSearch(tabs, query);
  const isSearching = query.trim().length > 0;

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const modKey = getModKey();

  const footer = (
    <Button variant="primary" onClick={closeHelp}>
      Done
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeHelp}
      title="Help"
      icon={<Question size={24} weight="light" className="text-neutral-500" />}
      widthClass="max-w-2xl"
      headerStyle="figma"
      footerStyle="figma"
      contentPadding="p-0"
      footer={footer}
    >
      {/* Search bar */}
      <div className="px-6 pt-5 pb-3">
        <HelpSearchInput value={query} onChange={setQuery} />
      </div>

      {/* Tab bar (hidden during search) */}
      {!isSearching && (
        <div className="px-6 flex gap-1 border-b border-neutral-200">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                  isActive
                    ? "text-brand-600"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
                role="tab"
                aria-selected={isActive}
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

      {/* Content */}
      <div className="px-6 py-4 overflow-y-auto max-h-[55vh] scrollbar-thin">
        {isSearching ? (
          // Search results
          searchResults.length > 0 ? (
            <>
              <p className="text-xs text-neutral-400 mb-3">
                {matchCount} result{matchCount !== 1 ? "s" : ""} for &ldquo;
                {query.trim()}&rdquo;
              </p>
              <HelpSectionList sections={searchResults} defaultOpen />
            </>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-8">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          )
        ) : activeTab === "getting-started" ? (
          <GettingStartedTab sections={currentTab.sections} />
        ) : activeTab === "shortcuts" ? (
          <>
            <HelpSectionList
              sections={currentTab.sections}
              compact
              defaultOpen
            />
            <div className="mt-4">
              <Alert variant="info">
                <span className="text-sm">
                  {isMac() ? (
                    <>
                      <Command size={14} className="inline-block -mt-0.5" /> is
                      the Command key on Mac.
                    </>
                  ) : (
                    `Most shortcuts use ${modKey} as the modifier key.`
                  )}
                </span>
              </Alert>
            </div>
          </>
        ) : (
          // Features tab
          <HelpSectionList sections={currentTab.sections} />
        )}
      </div>
    </Modal>
  );
}

// Re-export TAB_IDS for use in tests
export { TAB_IDS };
