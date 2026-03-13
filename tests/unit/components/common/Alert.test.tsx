/**
 * Unit tests for Alert component — variants, roles, icons, and className merging.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "@/components/common/Alert";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAlert(
  variant: "info" | "warning" | "error" | "neutral",
  content = "Test message",
  props: Partial<React.ComponentProps<typeof Alert>> = {}
) {
  return render(
    <Alert variant={variant} {...props}>
      {content}
    </Alert>
  );
}

// ---------------------------------------------------------------------------
// ARIA roles
// ---------------------------------------------------------------------------

describe("Alert — ARIA roles", () => {
  it('renders role="alert" for error variant', () => {
    renderAlert("error");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it('renders role="alert" for warning variant', () => {
    renderAlert("warning");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it('renders role="note" for info variant', () => {
    renderAlert("info");
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it('renders role="note" for neutral variant', () => {
    renderAlert("neutral");
    expect(screen.getByRole("note")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Content rendering
// ---------------------------------------------------------------------------

describe("Alert — content rendering", () => {
  it("renders children text", () => {
    renderAlert("info", "Hello world");
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders JSX children", () => {
    render(
      <Alert variant="info">
        <strong data-testid="strong-child">bold</strong>
      </Alert>
    );
    expect(screen.getByTestId("strong-child")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Icon rendering
// ---------------------------------------------------------------------------

describe("Alert — icon rendering", () => {
  it("renders default icon (aria-hidden)", () => {
    const { container } = renderAlert("info");
    const iconWrapper = container.querySelector("[aria-hidden='true']");
    expect(iconWrapper).not.toBeNull();
  });

  it("renders custom icon when provided", () => {
    render(
      <Alert variant="info" icon={<span data-testid="custom-icon">!</span>}>
        Content
      </Alert>
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("custom icon replaces the default icon", () => {
    const { container } = render(
      <Alert variant="info" icon={<span data-testid="custom-icon">!</span>}>
        Content
      </Alert>
    );
    // Only one icon wrapper should exist
    const iconWrappers = container.querySelectorAll("[aria-hidden='true']");
    expect(iconWrappers).toHaveLength(1);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// className merging
// ---------------------------------------------------------------------------

describe("Alert — className prop", () => {
  it("applies additional className to the container", () => {
    const { container } = renderAlert("info", "msg", {
      className: "my-custom-class",
    });
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("does not add extra space when className is empty string (default)", () => {
    const { container } = renderAlert("info");
    // Default is empty string; class should not have a leading/trailing space artifact
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toMatch(/\s{2,}/); // no double-spaces
  });
});

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

describe("Alert — variant container classes", () => {
  it("info variant has blue container classes", () => {
    const { container } = renderAlert("info");
    expect(container.firstChild).toHaveClass("bg-blue-50", "border-blue-200");
  });

  it("warning variant has amber container classes", () => {
    const { container } = renderAlert("warning");
    expect(container.firstChild).toHaveClass(
      "bg-amber-50",
      "border-amber-200"
    );
  });

  it("error variant has red container classes", () => {
    const { container } = renderAlert("error");
    expect(container.firstChild).toHaveClass("bg-red-50", "border-red-200");
  });

  it("neutral variant has neutral container classes", () => {
    const { container } = renderAlert("neutral");
    expect(container.firstChild).toHaveClass(
      "bg-neutral-100",
      "border-neutral-200"
    );
  });
});
