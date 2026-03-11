/**
 * Tests for shared input styling constants.
 * These constants are accessibility-critical (focus rings, WCAG touch targets)
 * and are reused across Radio, Checkbox, RadioOptionCard, and LabeledCheckbox.
 * Regression tests guard against accidental changes.
 */

import { describe, it, expect } from "vitest";
import {
  PEER_FOCUS_RING,
  PEER_ACTIVE_SCALE,
  OPTION_CARD_MIN_HEIGHT,
  OPTION_CARD_LAYOUT,
} from "../../../src/styles/inputStyles";

describe("PEER_FOCUS_RING", () => {
  it("applies a 2px ring using the brand-200 color", () => {
    expect(PEER_FOCUS_RING).toContain("peer-focus-visible:ring-2");
    expect(PEER_FOCUS_RING).toContain("peer-focus-visible:ring-brand-200");
  });

  it("includes a ring offset for visual separation", () => {
    expect(PEER_FOCUS_RING).toContain("peer-focus-visible:ring-offset-1");
  });
});

describe("PEER_ACTIVE_SCALE", () => {
  it("scales down slightly on active state", () => {
    expect(PEER_ACTIVE_SCALE).toBe("peer-active:scale-95");
  });
});

describe("OPTION_CARD_MIN_HEIGHT", () => {
  it("meets WCAG 2.5.5 minimum touch target height of 44px", () => {
    // WCAG 2.5.5 requires at least 44x44 CSS pixels for interactive controls.
    expect(OPTION_CARD_MIN_HEIGHT).toBe("min-h-[44px]");
  });
});

describe("OPTION_CARD_LAYOUT", () => {
  it("includes gap, padding, border-radius, and border classes", () => {
    expect(OPTION_CARD_LAYOUT).toContain("gap-3.5");
    expect(OPTION_CARD_LAYOUT).toContain("p-4");
    expect(OPTION_CARD_LAYOUT).toContain("rounded-md");
    expect(OPTION_CARD_LAYOUT).toContain("border");
  });

  it("does not prescribe a flex display class (consumers must add flex)", () => {
    // Consumers (RadioOptionCard, LabeledCheckbox) supply their own flex class.
    expect(OPTION_CARD_LAYOUT).not.toContain("flex");
  });
});
