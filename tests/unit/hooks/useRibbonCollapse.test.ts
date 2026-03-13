/**
 * Unit tests for useRibbonCollapse hook.
 * Covers: initial state, tab-change reset, measurement logic, ResizeObserver
 * wiring and cleanup, null-ref safety.
 *
 * Strategy: a thin wrapper component renders a div with ref={contentRef} so that
 * the ref is attached before useEffect fires, matching real usage.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import { renderHook, render, act } from '@testing-library/react';
import React from 'react';
import { useRibbonCollapse } from '@/hooks/useRibbonCollapse';
import type { CollapseLevel } from '@/components/Ribbon/RibbonCollapseContext';

// ─── ResizeObserver mock ───

type ResizeCallback = (entries: ResizeObserverEntry[]) => void;

interface MockObserverInstance {
  observe: Mock;
  disconnect: Mock;
  unobserve: Mock;
  _triggerResize: () => void;
}

const observerInstances: MockObserverInstance[] = [];

const MockResizeObserver = vi.fn((cb: ResizeCallback) => {
  const instance: MockObserverInstance = {
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
    _triggerResize: () => cb([] as unknown as ResizeObserverEntry[]),
  };
  observerInstances.push(instance);
  return instance;
});

vi.stubGlobal('ResizeObserver', MockResizeObserver);

// ─── Test component (using createElement, not JSX) ───

interface TestRibbonProps {
  activeTab: string;
  onResult?: (level: CollapseLevel) => void;
}

function TestRibbon({ activeTab, onResult }: TestRibbonProps): React.ReactElement {
  const { collapseLevel, contentRef } = useRibbonCollapse(activeTab);
  onResult?.(collapseLevel);

  return React.createElement(
    'div',
    { 'data-testid': 'toolbar' },
    React.createElement(
      'div',
      { ref: contentRef, 'data-testid': 'content' },
      React.createElement('button', null, 'A'),
      React.createElement('button', null, 'B')
    )
  );
}

// ─── DOM measurement helpers ───

function mockContentNaturalWidth(
  contentEl: Element,
  naturalWidth: number
): void {
  const children = Array.from(contentEl.children) as HTMLElement[];
  if (children.length < 2) return;
  const half = naturalWidth / 2;
  vi.spyOn(children[0], 'getBoundingClientRect').mockReturnValue({
    left: 0, right: half, top: 0, bottom: 30,
    width: half, height: 30, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  vi.spyOn(children[children.length - 1], 'getBoundingClientRect').mockReturnValue({
    left: half, right: naturalWidth, top: 0, bottom: 30,
    width: half, height: 30, x: half, y: 0, toJSON: () => ({}),
  } as DOMRect);
}

function mockToolbarDimensions(toolbarEl: Element, width: number): void {
  Object.defineProperty(toolbarEl, 'clientWidth', {
    get: () => width, configurable: true,
  });
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    paddingLeft: '8', paddingRight: '8',
  } as unknown as CSSStyleDeclaration);
}

async function flushRAF(): Promise<void> {
  await act(async () => {
    await new Promise<void>((res) => requestAnimationFrame(() => res()));
    await new Promise<void>((res) => requestAnimationFrame(() => res()));
  });
}

// ─── Tests ───

describe('useRibbonCollapse', () => {
  beforeEach(() => {
    MockResizeObserver.mockClear();
    observerInstances.length = 0;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // ─── Initial state ───

  describe('initial state', () => {
    it('should start with collapseLevel 0', () => {
      const { result } = renderHook(() => useRibbonCollapse('home'));
      expect(result.current.collapseLevel).toBe(0);
    });

    it('should expose a contentRef object', () => {
      const { result } = renderHook(() => useRibbonCollapse('home'));
      expect('current' in result.current.contentRef).toBe(true);
    });
  });

  // ─── Tab change reset ───

  describe('tab change reset', () => {
    it('should reset collapseLevel to 0 when activeTab changes', async () => {
      let level: CollapseLevel = 0;
      const container = document.createElement('div');
      document.body.appendChild(container);

      const { rerender } = render(
        React.createElement(TestRibbon, {
          activeTab: 'home',
          onResult: (lvl) => { level = lvl; },
        }),
        { container }
      );

      await flushRAF();

      act(() => {
        rerender(
          React.createElement(TestRibbon, {
            activeTab: 'view',
            onResult: (lvl) => { level = lvl; },
          })
        );
      });

      expect(level).toBe(0);
    });

    it('should reset on repeated tab changes', async () => {
      let level: CollapseLevel = 0;
      const container = document.createElement('div');
      document.body.appendChild(container);

      const { rerender } = render(
        React.createElement(TestRibbon, {
          activeTab: 'home',
          onResult: (lvl) => { level = lvl; },
        }),
        { container }
      );

      await flushRAF();

      act(() => {
        rerender(
          React.createElement(TestRibbon, {
            activeTab: 'view',
            onResult: (lvl) => { level = lvl; },
          })
        );
      });
      expect(level).toBe(0);

      act(() => {
        rerender(
          React.createElement(TestRibbon, {
            activeTab: 'home',
            onResult: (lvl) => { level = lvl; },
          })
        );
      });
      expect(level).toBe(0);
    });
  });

  // ─── Collapse level calculation ───

  describe('collapse level calculation', () => {
    it('should stay at level 0 when content fits', async () => {
      let level: CollapseLevel = -1 as CollapseLevel;
      const container = document.createElement('div');
      document.body.appendChild(container);

      render(
        React.createElement(TestRibbon, {
          activeTab: 'home',
          onResult: (lvl) => { level = lvl; },
        }),
        { container }
      );

      const toolbar = container.querySelector('[data-testid="toolbar"]') as HTMLElement;
      const content = container.querySelector('[data-testid="content"]') as HTMLElement;

      mockToolbarDimensions(toolbar, 800); // available = 784
      mockContentNaturalWidth(content, 300); // overflow = negative → fits

      await flushRAF();
      expect(level).toBe(0);
    });

    it('should report a level > 0 when overflow exceeds threshold', async () => {
      let level: CollapseLevel = 0;
      const container = document.createElement('div');
      document.body.appendChild(container);

      render(
        React.createElement(TestRibbon, {
          activeTab: 'home',
          onResult: (lvl) => { level = lvl; },
        }),
        { container }
      );

      const toolbar = container.querySelector('[data-testid="toolbar"]') as HTMLElement;
      const content = container.querySelector('[data-testid="content"]') as HTMLElement;

      // available = 200 - 16 = 184; naturalWidth = 500; overflow = 316 → level 5
      mockToolbarDimensions(toolbar, 200);
      mockContentNaturalWidth(content, 500);

      await flushRAF();
      expect(level).toBeGreaterThan(0);
    });

    it('should produce higher collapse level for more overflow', async () => {
      let levelMild: CollapseLevel = 0;
      let levelSevere: CollapseLevel = 0;

      const c1 = document.createElement('div');
      const c2 = document.createElement('div');
      document.body.appendChild(c1);
      document.body.appendChild(c2);

      render(
        React.createElement(TestRibbon, {
          activeTab: 'home',
          onResult: (lvl) => { levelMild = lvl; },
        }),
        { container: c1 }
      );
      render(
        React.createElement(TestRibbon, {
          activeTab: 'home',
          onResult: (lvl) => { levelSevere = lvl; },
        }),
        { container: c2 }
      );

      const toolbar1 = c1.querySelector('[data-testid="toolbar"]') as HTMLElement;
      const content1 = c1.querySelector('[data-testid="content"]') as HTMLElement;
      const toolbar2 = c2.querySelector('[data-testid="toolbar"]') as HTMLElement;
      const content2 = c2.querySelector('[data-testid="content"]') as HTMLElement;

      // Mild overflow: toolbar=280, natural=300 → overflow=300-(280-16)=36 → level 1
      Object.defineProperty(toolbar1, 'clientWidth', { get: () => 280, configurable: true });
      // Severe: toolbar=200, natural=500 → level 5
      Object.defineProperty(toolbar2, 'clientWidth', { get: () => 200, configurable: true });

      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        paddingLeft: '8', paddingRight: '8',
      } as unknown as CSSStyleDeclaration);

      mockContentNaturalWidth(content1, 300);
      mockContentNaturalWidth(content2, 500);

      await flushRAF();
      expect(levelSevere).toBeGreaterThanOrEqual(levelMild);
    });
  });

  // ─── ResizeObserver wiring ───

  describe('ResizeObserver', () => {
    it('should create a ResizeObserver on mount', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      render(
        React.createElement(TestRibbon, { activeTab: 'home' }),
        { container }
      );

      await flushRAF();
      expect(MockResizeObserver).toHaveBeenCalled();
    });

    it('should observe the toolbar (parent of content)', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      render(
        React.createElement(TestRibbon, { activeTab: 'home' }),
        { container }
      );

      await flushRAF();

      const toolbar = container.querySelector('[data-testid="toolbar"]') as HTMLElement;
      const observer = observerInstances.at(-1);
      expect(observer?.observe).toHaveBeenCalledWith(toolbar);
    });

    it('should disconnect the ResizeObserver on unmount', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const { unmount } = render(
        React.createElement(TestRibbon, { activeTab: 'home' }),
        { container }
      );

      await flushRAF();

      const observer = observerInstances.at(-1);
      expect(observer).toBeDefined();

      act(() => unmount());
      expect(observer?.disconnect).toHaveBeenCalled();
    });

    it('should re-measure and update collapseLevel when ResizeObserver fires', async () => {
      let level: CollapseLevel = -1 as CollapseLevel;
      const container = document.createElement('div');
      document.body.appendChild(container);

      render(
        React.createElement(TestRibbon, {
          activeTab: 'home',
          onResult: (lvl) => { level = lvl; },
        }),
        { container }
      );

      const toolbar = container.querySelector('[data-testid="toolbar"]') as HTMLElement;
      const content = container.querySelector('[data-testid="content"]') as HTMLElement;

      // Wide toolbar initially
      mockToolbarDimensions(toolbar, 800);
      mockContentNaturalWidth(content, 300);

      await flushRAF();
      expect(level).toBe(0);

      // Narrow the toolbar
      Object.defineProperty(toolbar, 'clientWidth', {
        get: () => 200, configurable: true,
      });

      const observer = observerInstances.at(-1);

      await act(async () => {
        observer?._triggerResize();
        await new Promise<void>((res) => requestAnimationFrame(() => res()));
      });

      expect(level).toBeGreaterThan(0);
    });
  });

  // ─── Null safety ───

  describe('null safety', () => {
    it('should not throw when contentRef is null (used without component mount)', async () => {
      const { result } = renderHook(() => useRibbonCollapse('home'));
      expect(result.current.contentRef.current).toBeNull();

      await act(async () => {
        await new Promise<void>((res) => requestAnimationFrame(() => res()));
      });

      expect(result.current.collapseLevel).toBe(0);
    });
  });
});
