/**
 * Ribbon - MS Office-style ribbon menu
 *
 * Design: Collapsed ribbon with tab navigation and icon toolbar
 *
 * Layout Structure:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ [Logo] │ File │ Home │ View │ Help │                      right actions │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ [Tab-specific toolbar content - 40px height]                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useCallback } from "react";

import OwnChartLogo from "../../assets/logo.svg?react";

import { ToolbarSpacer } from "../Toolbar/ToolbarPrimitives";
import { FileMenu } from "./FileMenu";
import { InlineProjectTitle } from "./InlineProjectTitle";
import { RibbonCollapseProvider } from "./RibbonCollapseContext";
import { useRibbonCollapse } from "../../hooks/useRibbonCollapse";
import { HomeTabContent } from "./HomeTabContent";
import { ViewTabContent } from "./ViewTabContent";
import { FormatTabContent } from "./FormatTabContent";
import { HelpTabContent } from "./HelpTabContent";

import { useTaskStore } from "../../store/slices/taskSlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { useFileOperations } from "../../hooks/useFileOperations";
import { COLORS, SHADOWS, RADIUS, SPACING } from "../../styles/design-tokens";

/** Height of the tab bar row (px) */
const TAB_BAR_HEIGHT = 36;
/** Height of the floating toolbar content (px) */
const TOOLBAR_HEIGHT = 40;

type RibbonTab = "home" | "view" | "format" | "help";

export function Ribbon(): JSX.Element {
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");
  const [renameRequested, setRenameRequested] = useState(false);

  // Smart Labels — responsive collapse
  const { collapseLevel, contentRef } = useRibbonCollapse(activeTab);

  // UI store
  const openExportDialog = useUIStore((state) => state.openExportDialog);

  // File operations
  const { handleNew, handleOpen, handleSave, handleSaveAs } =
    useFileOperations();

  // ─────────────────────────────────────────────────────────────────────────
  // F2 Keyboard Shortcut → Rename
  // ─────────────────────────────────────────────────────────────────────────

  const handleF2 = useCallback((e: KeyboardEvent): void => {
    if (e.key === "F2") {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Don't trigger rename when a table cell is active — F2 means "edit cell" there
      if (useTaskStore.getState().activeCell.taskId) return;
      e.preventDefault();
      setRenameRequested(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleF2);
    return () => window.removeEventListener("keydown", handleF2);
  }, [handleF2]);

  // ─────────────────────────────────────────────────────────────────────────
  // Tab Content
  // ─────────────────────────────────────────────────────────────────────────

  const renderTabContent = (): JSX.Element => {
    switch (activeTab) {
      case "home":
        return <HomeTabContent />;
      case "view":
        return <ViewTabContent />;
      case "format":
        return <FormatTabContent />;
      case "help":
        return <HelpTabContent />;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const tabs: { id: RibbonTab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "view", label: "View" },
    { id: "format", label: "Format" },
    { id: "help", label: "Help" },
  ];

  return (
    <header
      className="flex-shrink-0 relative"
      style={{
        zIndex: 100,
        backgroundColor: COLORS.neutral[50],
        paddingBottom: SPACING[2],
      }}
    >
      {/* Tab Bar - Fixed at top (MS colorNeutralBackground3) */}
      <div
        className="flex items-center"
        style={{ height: `${TAB_BAR_HEIGHT}px` }}
      >
        {/* Tabs - MS Office style */}
        <div
          className="flex items-center h-full"
          role="tablist"
          style={{ paddingLeft: SPACING[2] }}
        >
          {/* File Button - Opens dropdown instead of switching tabs */}
          <FileMenu
            onNew={handleNew}
            onOpen={handleOpen}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onRename={() => setRenameRequested(true)}
            onExport={openExportDialog}
          />

          {/* Regular tabs */}
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const classes = [
              "ribbon-tab",
              "ribbon-tab-standard",
              isActive ? "ribbon-tab-active" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={classes}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Project title - centered, inline-editable (Figma-style) */}
        <InlineProjectTitle
          triggerEdit={renameRequested}
          onEditTriggered={() => setRenameRequested(false)}
        />

        <ToolbarSpacer />

        {/* Logo - right side */}
        <div className="flex items-center px-3 h-full">
          <OwnChartLogo
            width={18}
            height={18}
            className="text-brand-600"
            aria-label="OwnChart"
          />
        </div>
      </div>

      {/* Floating Toolbar - MS Office style */}
      <div
        className="flex items-center justify-between px-3 gap-1"
        style={{
          height: `${TOOLBAR_HEIGHT}px`,
          backgroundColor: COLORS.neutral[0],
          boxShadow: SHADOWS.rest,
          borderRadius: RADIUS.lg,
          width: `calc(100% - ${SPACING[4]})`,
          margin: `0 ${SPACING[2]}`,
          position: "relative",
          zIndex: 2,
          transition: "height 150ms cubic-bezier(0.1, 0.9, 0.2, 1)",
        }}
      >
        <div ref={contentRef} className="flex items-center gap-1">
          <RibbonCollapseProvider value={collapseLevel}>
            {renderTabContent()}
          </RibbonCollapseProvider>
        </div>
      </div>
    </header>
  );
}
