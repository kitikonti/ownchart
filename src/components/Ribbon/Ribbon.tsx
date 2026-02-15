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
import { Question } from "@phosphor-icons/react";

import OwnChartLogo from "../../assets/logo.svg?react";

import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSpacer,
  TOOLBAR_TOKENS,
} from "../Toolbar/ToolbarPrimitives";
import { FileMenu } from "./FileMenu";
import { InlineProjectTitle } from "./InlineProjectTitle";
import { RibbonCollapseProvider } from "./RibbonCollapseContext";
import { useRibbonCollapse } from "../../hooks/useRibbonCollapse";
import { HomeTabContent } from "./HomeTabContent";
import { ViewTabContent } from "./ViewTabContent";
import { FormatTabContent } from "./FormatTabContent";

import { useTaskStore } from "../../store/slices/taskSlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { useFileOperations } from "../../hooks/useFileOperations";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

type RibbonTab = "home" | "view" | "format" | "help";

export function Ribbon(): JSX.Element {
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");
  const [renameRequested, setRenameRequested] = useState(false);

  // Smart Labels — responsive collapse
  const { collapseLevel, contentRef } = useRibbonCollapse(activeTab);

  // UI store
  const openExportDialog = useUIStore((state) => state.openExportDialog);
  const openHelpPanel = useUIStore((state) => state.openHelpPanel);

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
        return (
          <ToolbarGroup label="Help">
            <ToolbarButton
              onClick={openHelpPanel}
              title="Help (?)"
              aria-label="Help"
              icon={<Question size={ICON_SIZE} weight="light" />}
              label="Help"
            />
          </ToolbarGroup>
        );
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
      style={{ zIndex: 100, backgroundColor: "#f5f5f5", paddingBottom: "8px" }}
    >
      {/* Tab Bar - Fixed at top (MS uses colorNeutralBackground3 = #f5f5f5) */}
      <div
        className="flex items-center"
        style={{
          height: "36px",
        }}
      >
        {/* Tabs - MS Office style */}
        <div
          className="flex items-center h-full"
          role="tablist"
          style={{ paddingLeft: "8px" }}
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
            style={{ color: "#0F6CBD" }}
            aria-label="OwnChart"
          />
        </div>
      </div>

      {/* Floating Toolbar - MS Office style */}
      <div
        className="flex items-center justify-between px-3 gap-1"
        style={{
          height: "40px",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)",
          borderRadius: "8px",
          width: "calc(100% - 16px)",
          margin: "0 8px",
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
