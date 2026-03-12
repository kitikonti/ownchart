/**
 * Unit tests for InsertLine component.
 * Verifies correct position and style for "above" and "below" variants.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { InsertLine } from "../../../../src/components/TaskList/InsertLine";
import { INSERT_BUTTON_HIT_AREA } from "../../../../src/components/TaskList/rowNumberConfig";

describe("InsertLine", () => {
  it("renders a div element", () => {
    const { container } = render(<InsertLine position="above" />);
    expect(container.querySelector("div")).not.toBeNull();
  });

  it("has pointer-events-none class", () => {
    const { container } = render(<InsertLine position="above" />);
    const el = container.querySelector("div") as HTMLElement;
    expect(el.className).toContain("pointer-events-none");
  });

  it("is absolutely positioned", () => {
    const { container } = render(<InsertLine position="above" />);
    const el = container.querySelector("div") as HTMLElement;
    expect(el.className).toContain("absolute");
  });

  it("uses top: -1px for 'above' position", () => {
    const { container } = render(<InsertLine position="above" />);
    const el = container.querySelector("div") as HTMLElement;
    expect(el.style.top).toBe("-1px");
    expect(el.style.bottom).toBe("");
  });

  it("uses bottom: -1px for 'below' position", () => {
    const { container } = render(<InsertLine position="below" />);
    const el = container.querySelector("div") as HTMLElement;
    expect(el.style.bottom).toBe("-1px");
    expect(el.style.top).toBe("");
  });

  it("sets left offset equal to INSERT_BUTTON_HIT_AREA", () => {
    const { container } = render(<InsertLine position="above" />);
    const el = container.querySelector("div") as HTMLElement;
    expect(el.style.left).toBe(`${INSERT_BUTTON_HIT_AREA}px`);
  });

  it("has a non-zero height", () => {
    const { container } = render(<InsertLine position="above" />);
    const el = container.querySelector("div") as HTMLElement;
    expect(el.style.height).not.toBe("0px");
    expect(el.style.height).toBeTruthy();
  });

  it("has a backgroundColor set", () => {
    const { container } = render(<InsertLine position="above" />);
    const el = container.querySelector("div") as HTMLElement;
    expect(el.style.backgroundColor).toBeTruthy();
  });

  it("extends beyond the viewport via large negative right value", () => {
    // INSERT_LINE_RIGHT_EXTEND_PX = -9999 — the mechanism that makes the line
    // span both the task-list and timeline panels without requiring overflow:visible
    // on every ancestor.
    const { container } = render(<InsertLine position="above" />);
    const el = container.querySelector("div") as HTMLElement;
    expect(el.style.right).toBe("-9999px");
  });
});
