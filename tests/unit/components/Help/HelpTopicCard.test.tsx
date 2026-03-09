/**
 * Unit tests for HelpTopicCard, KeyBadge, MenuPathLabel, and ShortcutKeys.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  HelpTopicCard,
  KeyBadge,
  MenuPathLabel,
  ShortcutKeys,
} from "../../../../src/components/Help/HelpTopicCard";
import type { HelpTopic } from "../../../../src/config/helpContent";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const BASIC_TOPIC: HelpTopic = {
  id: "test-topic",
  title: "Save Project",
  description: "Saves the current project to disk.",
};

const TOPIC_WITH_SHORTCUT: HelpTopic = {
  ...BASIC_TOPIC,
  shortcuts: ["Ctrl+S"],
};

const TOPIC_WITH_MENU_PATH: HelpTopic = {
  ...BASIC_TOPIC,
  menuPath: "File > Save",
};

const TOPIC_WITH_TIP: HelpTopic = {
  ...BASIC_TOPIC,
  tip: "Saves automatically on close.",
};

// ---------------------------------------------------------------------------
// KeyBadge
// ---------------------------------------------------------------------------

describe("KeyBadge", () => {
  it("renders children inside a <kbd> element", () => {
    render(<KeyBadge>Ctrl</KeyBadge>);
    const kbd = screen.getByText("Ctrl");
    expect(kbd.tagName.toLowerCase()).toBe("kbd");
  });

  it("applies monospace and border classes", () => {
    render(<KeyBadge>S</KeyBadge>);
    const kbd = screen.getByText("S");
    expect(kbd.className).toContain("font-mono");
    expect(kbd.className).toContain("border");
  });
});

// ---------------------------------------------------------------------------
// MenuPathLabel
// ---------------------------------------------------------------------------

describe("MenuPathLabel", () => {
  it("renders each path segment", () => {
    render(<MenuPathLabel path="View > Columns > Progress" />);
    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.getByText("Columns")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
  });

  it("renders a single segment without separators", () => {
    render(<MenuPathLabel path="Help" />);
    expect(screen.getByText("Help")).toBeInTheDocument();
    // Separator › is aria-hidden; with a single part there should be none
    const ariaHidden = document.querySelectorAll("[aria-hidden='true']");
    expect(ariaHidden).toHaveLength(0);
  });

  it("renders separator as aria-hidden", () => {
    render(<MenuPathLabel path="A > B" />);
    const separators = document.querySelectorAll("[aria-hidden='true']");
    expect(separators).toHaveLength(1);
    expect(separators[0].textContent).toBe("›");
  });
});

// ---------------------------------------------------------------------------
// ShortcutKeys
// ---------------------------------------------------------------------------

describe("ShortcutKeys", () => {
  it("renders each key as a KeyBadge (kbd element)", () => {
    render(<ShortcutKeys keys="Ctrl+S" />);
    const kbds = document.querySelectorAll("kbd");
    expect(kbds.length).toBeGreaterThanOrEqual(1);
  });

  it("has aria-label with the resolved shortcut string", () => {
    render(<ShortcutKeys keys="Ctrl+S" />);
    // The wrapping span should have the aria-label
    const wrapper = document.querySelector("[aria-label]") as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.getAttribute("aria-label")).toContain("S");
  });

  it("renders individual key parts as aria-hidden", () => {
    render(<ShortcutKeys keys="Ctrl+S" />);
    const ariaHiddenSpans = document.querySelectorAll(
      "span[aria-hidden='true']"
    );
    expect(ariaHiddenSpans.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// HelpTopicCard — full (non-compact) mode
// ---------------------------------------------------------------------------

describe("HelpTopicCard — full mode", () => {
  it("renders the topic title", () => {
    render(<HelpTopicCard topic={BASIC_TOPIC} />);
    expect(screen.getByText("Save Project")).toBeInTheDocument();
  });

  it("renders the topic description", () => {
    render(<HelpTopicCard topic={BASIC_TOPIC} />);
    expect(
      screen.getByText("Saves the current project to disk.")
    ).toBeInTheDocument();
  });

  it("renders keyboard shortcut when provided", () => {
    render(<HelpTopicCard topic={TOPIC_WITH_SHORTCUT} />);
    const kbds = document.querySelectorAll("kbd");
    expect(kbds.length).toBeGreaterThan(0);
  });

  it("renders menuPath when no shortcuts and menuPath provided", () => {
    render(<HelpTopicCard topic={TOPIC_WITH_MENU_PATH} />);
    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("does not render shortcut section when neither shortcuts nor menuPath provided", () => {
    render(<HelpTopicCard topic={BASIC_TOPIC} />);
    expect(document.querySelectorAll("kbd")).toHaveLength(0);
  });

  it("renders tip text when provided", () => {
    render(<HelpTopicCard topic={TOPIC_WITH_TIP} />);
    expect(
      screen.getByText("Saves automatically on close.")
    ).toBeInTheDocument();
  });

  it("renders sr-only 'Tip:' prefix for screen readers when tip is present", () => {
    render(<HelpTopicCard topic={TOPIC_WITH_TIP} />);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly).not.toBeNull();
    expect(srOnly!.textContent).toBe("Tip: ");
  });

  it("does not render tip section when tip is not provided", () => {
    render(<HelpTopicCard topic={BASIC_TOPIC} />);
    expect(document.querySelector(".sr-only")).toBeNull();
  });

  it("renders title in an h4 element", () => {
    render(<HelpTopicCard topic={BASIC_TOPIC} />);
    const heading = screen.getByRole("heading", { level: 4 });
    expect(heading).toHaveTextContent("Save Project");
  });
});

// ---------------------------------------------------------------------------
// HelpTopicCard — compact mode
// ---------------------------------------------------------------------------

describe("HelpTopicCard — compact mode", () => {
  it("renders the topic description in compact mode", () => {
    render(<HelpTopicCard topic={BASIC_TOPIC} compact />);
    expect(
      screen.getByText("Saves the current project to disk.")
    ).toBeInTheDocument();
  });

  it("does not render topic title in compact mode", () => {
    render(<HelpTopicCard topic={BASIC_TOPIC} compact />);
    expect(screen.queryByText("Save Project")).not.toBeInTheDocument();
  });

  it("renders first shortcut in compact mode", () => {
    render(<HelpTopicCard topic={TOPIC_WITH_SHORTCUT} compact />);
    const kbds = document.querySelectorAll("kbd");
    expect(kbds.length).toBeGreaterThan(0);
  });

  it("renders menuPath in compact mode when no shortcuts", () => {
    render(<HelpTopicCard topic={TOPIC_WITH_MENU_PATH} compact />);
    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("renders nothing for shortcuts/menuPath in compact mode when neither is provided", () => {
    render(<HelpTopicCard topic={BASIC_TOPIC} compact />);
    expect(document.querySelectorAll("kbd")).toHaveLength(0);
  });
});
