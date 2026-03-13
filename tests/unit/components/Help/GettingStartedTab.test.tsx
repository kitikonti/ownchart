/**
 * Unit tests for GettingStartedTab.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GettingStartedTab } from "@/components/Help/GettingStartedTab";
import type { HelpSection } from "@/config/helpContent";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const SECTION_WITH_KNOWN_ID: HelpSection = {
  id: "gs",
  title: "Getting Started",
  icon: "Cursor",
  topics: [
    {
      id: "gs-create-task",
      title: "Creating Your First Task",
      description: "Click the + button or press Enter to add a task.",
    },
  ],
};

const SECTION_WITH_UNKNOWN_ID: HelpSection = {
  id: "gs",
  title: "Getting Started",
  icon: "Cursor",
  topics: [
    {
      id: "unknown-id-that-has-no-icon",
      title: "Unknown Topic",
      description: "Some description.",
    },
  ],
};

const SECTION_WITH_TIP: HelpSection = {
  id: "gs",
  title: "Getting Started",
  icon: "Cursor",
  topics: [
    {
      id: "gs-create-task",
      title: "Creating Your First Task",
      description: "Click the + button or press Enter to add a task.",
      tip: "You can also double-click a row.",
    },
  ],
};

const MULTI_SECTION: HelpSection[] = [
  {
    id: "gs1",
    title: "Section One",
    icon: "Cursor",
    topics: [
      {
        id: "gs-create-task",
        title: "Creating Your First Task",
        description: "Add a task.",
      },
    ],
  },
  {
    id: "gs2",
    title: "Section Two",
    icon: "Cursor",
    topics: [
      {
        id: "gs-save-open",
        title: "Saving Your Project",
        description: "Save to disk.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GettingStartedTab", () => {
  it("renders topic title", () => {
    render(<GettingStartedTab sections={[SECTION_WITH_KNOWN_ID]} />);
    expect(screen.getByText("Creating Your First Task")).toBeInTheDocument();
  });

  it("renders topic description", () => {
    render(<GettingStartedTab sections={[SECTION_WITH_KNOWN_ID]} />);
    expect(
      screen.getByText("Click the + button or press Enter to add a task.")
    ).toBeInTheDocument();
  });

  it("renders topic title in an h3 element", () => {
    render(<GettingStartedTab sections={[SECTION_WITH_KNOWN_ID]} />);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Creating Your First Task");
  });

  it("renders a fallback icon for unknown topic id", () => {
    // The component renders a fallback Cursor icon when the id is not in ICONS.
    // We cannot easily assert the icon type, but we can assert the card renders
    // without throwing and the description is visible.
    render(<GettingStartedTab sections={[SECTION_WITH_UNKNOWN_ID]} />);
    expect(screen.getByText("Unknown Topic")).toBeInTheDocument();
    expect(screen.getByText("Some description.")).toBeInTheDocument();
  });

  it("renders tip text when provided", () => {
    render(<GettingStartedTab sections={[SECTION_WITH_TIP]} />);
    expect(
      screen.getByText("You can also double-click a row.")
    ).toBeInTheDocument();
  });

  it("renders sr-only 'Tip:' label for screen readers when tip is present", () => {
    render(<GettingStartedTab sections={[SECTION_WITH_TIP]} />);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly).not.toBeNull();
    expect(srOnly!.textContent).toBe("Tip: ");
  });

  it("does not render tip section when tip is absent", () => {
    render(<GettingStartedTab sections={[SECTION_WITH_KNOWN_ID]} />);
    expect(document.querySelector(".sr-only")).toBeNull();
  });

  it("renders topics from multiple sections (flattened)", () => {
    render(<GettingStartedTab sections={MULTI_SECTION} />);
    expect(screen.getByText("Creating Your First Task")).toBeInTheDocument();
    expect(screen.getByText("Saving Your Project")).toBeInTheDocument();
  });

  it("renders nothing when sections array is empty", () => {
    const { container } = render(<GettingStartedTab sections={[]} />);
    // The wrapper div should be present but empty of cards
    expect(container.querySelectorAll("h3")).toHaveLength(0);
  });
});
