/**
 * Unit tests for AppErrorBoundary component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { AppErrorBoundary } from "../../../src/components/AppErrorBoundary";

// A child component that throws when the `shouldThrow` prop is true.
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }): JSX.Element {
  if (shouldThrow) {
    throw new Error("Test render error");
  }
  return <div>Normal content</div>;
}

/**
 * Wrapper that lets us toggle whether the child throws by clicking a test button.
 * Used to simulate the parent fixing the error condition before the boundary resets.
 */
function ControllableWrapper(): JSX.Element {
  const [shouldThrow, setShouldThrow] = React.useState(true);
  return (
    <>
      <button onClick={() => setShouldThrow(false)}>Fix child</button>
      <AppErrorBoundary>
        <ThrowingChild shouldThrow={shouldThrow} />
      </AppErrorBoundary>
    </>
  );
}

// Suppress the expected console.error output from React + AppErrorBoundary in tests.
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("AppErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </AppErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders the error fallback UI when a child throws", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </AppErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The application encountered an unexpected error. Please try reloading."
      )
    ).toBeInTheDocument();
  });

  it("shows Try again and Reload application buttons in the fallback UI", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </AppErrorBoundary>
    );

    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reload application" })
    ).toBeInTheDocument();
  });

  it("logs the error via console.error when a child throws", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </AppErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AppErrorBoundary]"),
      expect.any(Error),
      expect.anything()
    );
  });

  it("clears the error state (hasError → false) when Try again is clicked", () => {
    // ControllableWrapper renders the boundary with a throwing child.
    // Clicking "Fix child" stops the throw, then clicking "Try again" resets
    // the boundary — allowing the previously-throwing child to mount cleanly.
    render(<ControllableWrapper />);

    // Boundary enters error state immediately
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Stop the child from throwing, then reset the boundary
    fireEvent.click(screen.getByRole("button", { name: "Fix child" }));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("calls window.location.reload when Reload application is clicked", () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <AppErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </AppErrorBoundary>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reload application" }));

    expect(reloadSpy).toHaveBeenCalledOnce();
  });
});
