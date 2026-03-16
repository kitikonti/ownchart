/**
 * Unit tests for Button component and warnIfIconOnlyWithoutLabel helper.
 */

import { createRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, warnIfIconOnlyWithoutLabel, resetWarnedIconOnlyKeys } from "@/components/common/Button";

// ---------------------------------------------------------------------------
// Button rendering
// ---------------------------------------------------------------------------

describe("Button", () => {
  describe("renders with defaults", () => {
    it("renders as a button element with type=button", () => {
      render(<Button>Save</Button>);
      const button = screen.getByRole("button", { name: "Save" });
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
    });

    it("renders children as label text", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });
  });

  describe("variant styles", () => {
    it("applies primary variant classes by default", () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole("button", { name: "Primary" });
      expect(button.className).toContain("bg-brand-600");
    });

    it("applies secondary variant classes when variant=secondary", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button", { name: "Secondary" });
      expect(button.className).toContain("bg-white");
      expect(button.className).toContain("border-slate-300");
    });

    it("applies ghost variant classes when variant=ghost", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button", { name: "Ghost" });
      expect(button.className).toContain("bg-transparent");
    });

    it("applies danger variant classes when variant=danger", () => {
      render(<Button variant="danger">Delete</Button>);
      const button = screen.getByRole("button", { name: "Delete" });
      expect(button.className).toContain("bg-red-600");
    });
  });

  describe("size styles", () => {
    it("applies md size classes by default", () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole("button", { name: "Medium" });
      expect(button.className).toContain("h-8");
    });

    it("applies sm size classes when size=sm", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button", { name: "Small" });
      expect(button.className).toContain("h-7");
    });

    it("applies lg size classes when size=lg", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button", { name: "Large" });
      expect(button.className).toContain("h-10");
    });
  });

  describe("fullWidth prop", () => {
    it("adds w-full class when fullWidth=true", () => {
      render(<Button fullWidth>Full</Button>);
      expect(screen.getByRole("button", { name: "Full" }).className).toContain("w-full");
    });

    it("does not add w-full class by default", () => {
      render(<Button>Not full</Button>);
      expect(screen.getByRole("button", { name: "Not full" }).className).not.toContain("w-full");
    });
  });

  describe("disabled state", () => {
    it("passes disabled attribute to the button", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
    });

    it("applies disabled-specific Tailwind classes", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button", { name: "Disabled" });
      // All variants include disabled:cursor-not-allowed via baseStyles
      expect(button.className).toContain("disabled:cursor-not-allowed");
    });
  });

  describe("icon prop", () => {
    it("renders icon before children", () => {
      render(
        <Button icon={<span data-testid="icon" />} aria-label="Save">
          Save
        </Button>
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("renders iconAfter after children", () => {
      render(
        <Button iconAfter={<span data-testid="icon-after" />}>Export</Button>
      );
      expect(screen.getByTestId("icon-after")).toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("appends custom className to the button", () => {
      render(<Button className="my-custom-class">Custom</Button>);
      expect(screen.getByRole("button", { name: "Custom" }).className).toContain("my-custom-class");
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to the underlying button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("BUTTON");
    });
  });

  describe("additional HTML attributes", () => {
    it("forwards aria-label to the button element", () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByRole("button", { name: "Close dialog" })).toBeInTheDocument();
    });

    it("forwards data attributes to the button element", () => {
      render(<Button data-testid="my-btn">Test</Button>);
      expect(screen.getByTestId("my-btn")).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// warnIfIconOnlyWithoutLabel
// ---------------------------------------------------------------------------

describe("warnIfIconOnlyWithoutLabel", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // Reset the module-level deduplication set so each test starts clean.
    resetWarnedIconOnlyKeys();
  });

  it("emits a warning when icon-only button has no aria-label", () => {
    warnIfIconOnlyWithoutLabel(<span />, null, {});
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("[Button] Icon-only button detected without an `aria-label`")
    );
  });

  it("does not warn when aria-label is provided", () => {
    warnIfIconOnlyWithoutLabel(<span />, null, { "aria-label": "Close" });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("does not warn when children are present (labeled button)", () => {
    warnIfIconOnlyWithoutLabel(<span />, "Save", {});
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("does not warn when no icon is passed", () => {
    warnIfIconOnlyWithoutLabel(null, null, {});
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("deduplicates warnings for the same button id", () => {
    // First call should warn
    warnIfIconOnlyWithoutLabel(<span />, null, { id: "dedup-btn" });
    expect(console.warn).toHaveBeenCalledTimes(1);

    // Second call with the same id should NOT warn again
    warnIfIconOnlyWithoutLabel(<span />, null, { id: "dedup-btn" });
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("always warns for anonymous buttons (no id) — does not deduplicate them", () => {
    warnIfIconOnlyWithoutLabel(<span />, null, {});
    warnIfIconOnlyWithoutLabel(<span />, null, {});
    // Both anonymous buttons should emit warnings
    expect(console.warn).toHaveBeenCalledTimes(2);
  });
});
