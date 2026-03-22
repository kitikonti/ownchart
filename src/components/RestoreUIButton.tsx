/**
 * RestoreUIButton - Small floating button to restore hidden Ribbon & StatusBar.
 *
 * Rendered when hideUI is active. Positioned in the top-right corner.
 * Semi-transparent by default, fully opaque on hover.
 */

import { FrameCorners } from "@phosphor-icons/react";
import { useUserPreferencesStore } from "@/store/slices/userPreferencesSlice";
import { TOOLBAR } from "@/styles/design-tokens";

export function RestoreUIButton(): JSX.Element {
  const toggleHideUI = useUserPreferencesStore((state) => state.toggleHideUI);

  return (
    <button
      type="button"
      onClick={toggleHideUI}
      className="restore-ui-button"
      title="Show Toolbar (Ctrl+\)"
      aria-label="Show Toolbar"
    >
      <FrameCorners size={TOOLBAR.iconSize} weight="light" />
    </button>
  );
}
