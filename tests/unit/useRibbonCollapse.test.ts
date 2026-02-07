import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRibbonCollapse } from "../../src/hooks/useRibbonCollapse";

// ── ResizeObserver mock ──────────────────────────────────────────────────────

const disconnectMock = vi.fn();

class MockResizeObserver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_callback: ResizeObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = disconnectMock;
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

function buildDOM(toolbarWidth: number, contentChildrenWidth: number): {
  content: HTMLDivElement;
  toolbar: HTMLDivElement;
} {
  const toolbar = document.createElement("div");
  Object.defineProperty(toolbar, "clientWidth", {
    value: toolbarWidth,
    configurable: true,
  });

  const content = document.createElement("div");
  toolbar.appendChild(content);

  // Two children to define the content span via getBoundingClientRect
  const child1 = document.createElement("div");
  const child2 = document.createElement("div");
  child1.getBoundingClientRect = (): DOMRect =>
    ({ left: 0, right: 100 }) as DOMRect;
  child2.getBoundingClientRect = (): DOMRect =>
    ({ left: 100, right: contentChildrenWidth }) as DOMRect;
  content.appendChild(child1);
  content.appendChild(child2);

  return { content, toolbar };
}

/**
 * Helper: renders the hook, sets the ref, then triggers the effect
 * by switching tabs (init → target).
 *
 * The tab switch causes useEffect re-run which:
 * 1. Resets naturalWidth & collapseLevel to 0
 * 2. Creates ResizeObserver + calls rAF(measure)
 * 3. measure() captures naturalWidth, computes overflow, sets level
 */
function renderAndMeasure(
  content: HTMLDivElement,
  tab = "home"
): ReturnType<typeof renderHook<ReturnType<typeof useRibbonCollapse>, { tab: string }>> {
  const hook = renderHook(({ tab }) => useRibbonCollapse(tab), {
    initialProps: { tab: "__init__" },
  });

  // Attach mock DOM to the ref
  (hook.result.current.contentRef as { current: HTMLDivElement }).current =
    content;

  // Switch to target tab → triggers effect re-run with ref populated
  hook.rerender({ tab });

  return hook;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useRibbonCollapse", () => {
  beforeEach(() => {
    disconnectMock.mockClear();
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      paddingLeft: "12",
      paddingRight: "12",
    } as unknown as CSSStyleDeclaration);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts at collapse level 0", () => {
    const { result } = renderHook(() => useRibbonCollapse("home"));
    expect(result.current.collapseLevel).toBe(0);
  });

  it("stays at level 0 when content fits", () => {
    // Available: 524 - 12 - 12 = 500px, content: 490px → no overflow
    const { content } = buildDOM(524, 490);
    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(0);
  });

  it("level 1 on small overflow (>= 10px)", () => {
    // Available: 474 - 12 - 12 = 450px, content: 470px → overflow 20px
    // Thresholds: [10, 80, 160, 240, 320] → 20 >= 10 → level 1
    const { content } = buildDOM(474, 470);
    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(1);
  });

  it("level 2 on moderate overflow (>= 80px)", () => {
    // Available: 424 - 12 - 12 = 400px, content: 500px → overflow 100px
    // 100 >= 80 → level 2
    const { content } = buildDOM(424, 500);
    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(2);
  });

  it("level 3 on larger overflow (>= 160px)", () => {
    // Available: 324 - 12 - 12 = 300px, content: 500px → overflow 200px
    // 200 >= 160 → level 3
    const { content } = buildDOM(324, 500);
    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(3);
  });

  it("level 4 on large overflow (>= 240px)", () => {
    // Available: 224 - 12 - 12 = 200px, content: 500px → overflow 300px
    // 300 >= 240 → level 4
    const { content } = buildDOM(224, 500);
    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(4);
  });

  it("level 5 on very large overflow (>= 320px)", () => {
    // Available: 224 - 12 - 12 = 200px, content: 600px → overflow 400px
    // 400 >= 320 → level 5
    const { content } = buildDOM(224, 600);
    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(5);
  });

  it("resets and re-measures when activeTab changes", () => {
    const { content: overflowContent } = buildDOM(224, 600);
    const { result, rerender } = renderAndMeasure(overflowContent, "home");
    expect(result.current.collapseLevel).toBe(5);

    // Switch tab with fitting content → naturalWidth reset + re-measure → level 0
    const { content: fittingContent } = buildDOM(524, 300);
    (result.current.contentRef as { current: HTMLDivElement }).current =
      fittingContent;
    rerender({ tab: "view" });
    expect(result.current.collapseLevel).toBe(0);
  });

  it("disconnects ResizeObserver on unmount", () => {
    const { content } = buildDOM(500, 400);
    const { unmount } = renderAndMeasure(content);
    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it("handles content with no children gracefully", () => {
    const toolbar = document.createElement("div");
    Object.defineProperty(toolbar, "clientWidth", { value: 500 });
    const content = document.createElement("div");
    toolbar.appendChild(content);
    // No children — naturalWidth stays 0

    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(0);
  });

  it("handles missing parent element gracefully", () => {
    const content = document.createElement("div"); // no parent
    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(0);
  });

  it("does not collapse below threshold boundary", () => {
    // Available: 500 - 12 - 12 = 476px, content: 485px → overflow 9px
    // 9 < 10 → stays at level 0
    const { content } = buildDOM(500, 485);
    const { result } = renderAndMeasure(content);
    expect(result.current.collapseLevel).toBe(0);
  });
});
