/**
 * HelpTabContent - Toolbar content for the Help ribbon tab.
 */

import { Info, Question } from "@phosphor-icons/react";

import {
  ToolbarButton,
  ToolbarGroup,
  TOOLBAR_TOKENS,
} from "../Toolbar/ToolbarPrimitives";
import { useUIStore } from "../../store/slices/uiSlice";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

export function HelpTabContent(): JSX.Element {
  const openHelpPanel = useUIStore((state) => state.openHelpPanel);
  const openAboutDialog = useUIStore((state) => state.openAboutDialog);

  return (
    <ToolbarGroup label="Help">
      <ToolbarButton
        onClick={openHelpPanel}
        title="Help (?)"
        aria-label="Help"
        icon={<Question size={ICON_SIZE} weight="light" />}
        label="Help"
      />
      <ToolbarButton
        onClick={openAboutDialog}
        title="About OwnChart"
        aria-label="About"
        icon={<Info size={ICON_SIZE} weight="light" />}
        label="About"
      />
    </ToolbarGroup>
  );
}
