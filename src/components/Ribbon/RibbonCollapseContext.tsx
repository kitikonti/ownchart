/**
 * RibbonCollapseContext - Broadcasts collapse level to toolbar descendants.
 *
 * Controls responsive label hiding: as available space shrinks,
 * labels with lower priority numbers hide first.
 */

import { createContext, useContext } from "react";

export type CollapseLevel = 0 | 1 | 2 | 3 | 4 | 5;

const RibbonCollapseContext = createContext<CollapseLevel>(0);

export const RibbonCollapseProvider = RibbonCollapseContext.Provider;

export function useCollapseLevel(): CollapseLevel {
  return useContext(RibbonCollapseContext);
}

/**
 * Returns true if a label should be visible at the current collapse level.
 *
 * - Level 0 → all labels visible
 * - undefined priority → label never hides
 * - priority > level → visible; priority <= level → hidden
 */
export function shouldShowLabel(
  priority: number | undefined,
  level: CollapseLevel
): boolean {
  if (level === 0) return true;
  if (priority === undefined) return true;
  return priority > level;
}
