/**
 * Unit tests for HelpSectionList and SectionAccordion.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelpSectionList } from "../../../../src/components/Help/HelpSectionList";
import type { HelpSection } from "../../../../src/config/helpContent";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const SECTION_A: HelpSection = {
  id: "section-a",
  title: "Section Alpha",
  icon: "Cursor",
  topics: [
    {
      id: "topic-1",
      title: "First Topic",
      description: "Description of first topic.",
    },
    {
      id: "topic-2",
      title: "Second Topic",
      description: "Description of second topic.",
    },
  ],
};

const SECTION_B: HelpSection = {
  id: "section-b",
  title: "Section Beta",
  icon: "Cursor",
  topics: [
    {
      id: "topic-3",
      title: "Third Topic",
      description: "Description of third topic.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HelpSectionList", () => {
  it("renders section title buttons", () => {
    render(<HelpSectionList sections={[SECTION_A, SECTION_B]} />);
    expect(screen.getByText("Section Alpha")).toBeInTheDocument();
    expect(screen.getByText("Section Beta")).toBeInTheDocument();
  });

  it("renders topic count next to section title (aria-hidden)", () => {
    render(<HelpSectionList sections={[SECTION_A]} />);
    // The count is rendered as aria-hidden (visible) and sr-only (for screen readers)
    const ariaHiddenCount = document.querySelector("[aria-hidden='true']");
    expect(ariaHiddenCount).not.toBeNull();
    expect(ariaHiddenCount!.textContent).toBe("2");
  });

  it("renders sr-only topic count label for screen readers", () => {
    render(<HelpSectionList sections={[SECTION_A]} />);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly).not.toBeNull();
    expect(srOnly!.textContent).toContain("2 topics");
  });

  it("collapses sections by default (defaultOpen=false)", () => {
    render(<HelpSectionList sections={[SECTION_A]} />);
    const button = screen.getByRole("button", { name: /Section Alpha/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("topic cards are hidden when section is collapsed", () => {
    render(<HelpSectionList sections={[SECTION_A]} />);
    // The panel uses HTML hidden attribute when closed
    const panel = document.getElementById(`help-section-panel-${SECTION_A.id}`);
    expect(panel).not.toBeNull();
    expect(panel!.hidden).toBe(true);
  });

  it("expands section when header button is clicked", async () => {
    const user = userEvent.setup();
    render(<HelpSectionList sections={[SECTION_A]} />);

    const button = screen.getByRole("button", { name: /Section Alpha/ });
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("shows topic cards after section is expanded", async () => {
    const user = userEvent.setup();
    render(<HelpSectionList sections={[SECTION_A]} />);

    await user.click(screen.getByRole("button", { name: /Section Alpha/ }));

    const panel = document.getElementById(`help-section-panel-${SECTION_A.id}`);
    expect(panel!.hidden).toBe(false);
  });

  it("collapses an expanded section on second click", async () => {
    const user = userEvent.setup();
    render(<HelpSectionList sections={[SECTION_A]} />);

    const button = screen.getByRole("button", { name: /Section Alpha/ });
    await user.click(button); // open
    await user.click(button); // close

    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("opens all sections when defaultOpen=true", () => {
    render(<HelpSectionList sections={[SECTION_A, SECTION_B]} defaultOpen />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("button has aria-controls pointing to panel id", () => {
    render(<HelpSectionList sections={[SECTION_A]} />);
    const button = screen.getByRole("button", { name: /Section Alpha/ });
    expect(button).toHaveAttribute(
      "aria-controls",
      `help-section-panel-${SECTION_A.id}`
    );
  });

  it("renders nothing when sections array is empty", () => {
    const { container } = render(<HelpSectionList sections={[]} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("renders compact prop through to topic cards (no title shown)", () => {
    render(<HelpSectionList sections={[SECTION_A]} compact defaultOpen />);

    // In compact mode HelpTopicCard does not render the h4 title
    // — only the description is visible
    expect(screen.queryByRole("heading", { level: 4 })).not.toBeInTheDocument();
    expect(screen.getByText("Description of first topic.")).toBeInTheDocument();
  });
});

describe("HelpSectionList — defaultOpen sync", () => {
  it("syncs open state when defaultOpen prop changes from false to true", async () => {
    const { rerender } = render(
      <HelpSectionList sections={[SECTION_A]} defaultOpen={false} />
    );

    const button = screen.getByRole("button", { name: /Section Alpha/ });
    expect(button).toHaveAttribute("aria-expanded", "false");

    rerender(<HelpSectionList sections={[SECTION_A]} defaultOpen={true} />);

    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("syncs open state when defaultOpen prop changes from true to false", async () => {
    const { rerender } = render(
      <HelpSectionList sections={[SECTION_A]} defaultOpen={true} />
    );

    const button = screen.getByRole("button", { name: /Section Alpha/ });
    expect(button).toHaveAttribute("aria-expanded", "true");

    rerender(<HelpSectionList sections={[SECTION_A]} defaultOpen={false} />);

    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
