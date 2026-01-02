/**
 * Integration tests for ZoomToolbar component
 * Sprint 1.2 Package 3: Navigation & Scale
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ZoomToolbar } from '../../src/components/GanttChart/ZoomToolbar';
import { useChartStore } from '../../src/store/slices/chartSlice';
import { useTaskStore } from '../../src/store/slices/taskSlice';
import type { Task } from '../../src/types/chart.types';

describe('ZoomToolbar - Integration Tests', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      name: 'Task 1',
      startDate: '2025-01-01',
      endDate: '2025-01-10',
      duration: 10,
      progress: 0,
      color: '#3b82f6',
      order: 0,
      metadata: {},
    },
    {
      id: '2',
      name: 'Task 2',
      startDate: '2025-01-15',
      endDate: '2025-01-30',
      duration: 15,
      progress: 0,
      color: '#3b82f6',
      order: 1,
      metadata: {},
    },
  ];

  beforeEach(() => {
    // Reset stores before each test
    useChartStore.setState({
      scale: null,
      containerWidth: 800,
      dateRange: null,
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: true,
      isZooming: false,
      isPanning: false,
    });

    useTaskStore.setState({
      tasks: mockTasks,
      selectedTaskId: null,
    });
  });

  it('should render zoom toolbar with all controls', () => {
    render(<ZoomToolbar />);

    // Check for zoom buttons
    expect(screen.getByTitle('Zoom Out (Ctrl+-)')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom In (Ctrl++)')).toBeInTheDocument();
    expect(screen.getByTitle('Reset zoom to 100% (Ctrl+0)')).toBeInTheDocument();
    expect(screen.getByTitle('Fit to width')).toBeInTheDocument();

    // Check for zoom level dropdown
    expect(screen.getByLabelText('Zoom level')).toBeInTheDocument();
  });

  it('should display current zoom level in dropdown', () => {
    render(<ZoomToolbar />);

    const dropdown = screen.getByLabelText('Zoom level') as HTMLSelectElement;
    expect(dropdown.value).toBe('100');
  });

  it('should zoom in when clicking zoom in button', () => {
    render(<ZoomToolbar />);

    const zoomInButton = screen.getByTitle('Zoom In (Ctrl++)');
    fireEvent.click(zoomInButton);

    expect(useChartStore.getState().zoom).toBe(1.25);

    const dropdown = screen.getByLabelText('Zoom level') as HTMLSelectElement;
    expect(dropdown.value).toBe('125');
  });

  it('should zoom out when clicking zoom out button', () => {
    render(<ZoomToolbar />);

    const zoomOutButton = screen.getByTitle('Zoom Out (Ctrl+-)');
    fireEvent.click(zoomOutButton);

    expect(useChartStore.getState().zoom).toBe(0.75);

    const dropdown = screen.getByLabelText('Zoom level') as HTMLSelectElement;
    expect(dropdown.value).toBe('75');
  });

  it('should disable zoom in button at maximum zoom', () => {
    useChartStore.setState({ zoom: 3.0 });
    render(<ZoomToolbar />);

    const zoomInButton = screen.getByTitle('Zoom In (Ctrl++)');
    expect(zoomInButton).toBeDisabled();
  });

  it('should disable zoom out button at minimum zoom', () => {
    useChartStore.setState({ zoom: 0.5 });
    render(<ZoomToolbar />);

    const zoomOutButton = screen.getByTitle('Zoom Out (Ctrl+-)');
    expect(zoomOutButton).toBeDisabled();
  });

  it('should change zoom level when selecting from dropdown', () => {
    render(<ZoomToolbar />);

    const dropdown = screen.getByLabelText('Zoom level') as HTMLSelectElement;
    fireEvent.change(dropdown, { target: { value: '150' } });

    expect(useChartStore.getState().zoom).toBe(1.5);
  });

  it('should reset zoom when clicking reset button', () => {
    useChartStore.setState({ zoom: 2.0 });
    render(<ZoomToolbar />);

    const resetButton = screen.getByTitle('Reset zoom to 100% (Ctrl+0)');
    fireEvent.click(resetButton);

    expect(useChartStore.getState().zoom).toBe(1.0);
  });

  it('should call fitToView when clicking Fit to Width button', () => {
    render(<ZoomToolbar />);

    const fitToWidthButton = screen.getByTitle('Fit to width');
    fireEvent.click(fitToWidthButton);

    const state = useChartStore.getState();
    expect(state.zoom).toBeGreaterThan(0);
    expect(state.zoom).toBeGreaterThanOrEqual(0.5);
    expect(state.zoom).toBeLessThanOrEqual(3.0);
  });

  it('should call fitToView when selecting "Fit to Width" from dropdown', () => {
    render(<ZoomToolbar />);

    const dropdown = screen.getByLabelText('Zoom level') as HTMLSelectElement;
    fireEvent.change(dropdown, { target: { value: 'fit' } });

    const state = useChartStore.getState();
    expect(state.zoom).toBeGreaterThan(0);
  });

  it('should update dropdown when zoom changes externally', () => {
    const { rerender } = render(<ZoomToolbar />);

    // Change zoom externally - wrap in act() to handle state updates
    act(() => {
      useChartStore.getState().setZoom(2.0);
    });

    // Force re-render
    rerender(<ZoomToolbar />);

    const dropdown = screen.getByLabelText('Zoom level') as HTMLSelectElement;
    expect(dropdown.value).toBe('200');
  });

  it('should handle multiple zoom operations in sequence', () => {
    render(<ZoomToolbar />);

    const zoomInButton = screen.getByTitle('Zoom In (Ctrl++)');
    const zoomOutButton = screen.getByTitle('Zoom Out (Ctrl+-)');

    // Zoom in twice
    fireEvent.click(zoomInButton);
    fireEvent.click(zoomInButton);
    expect(useChartStore.getState().zoom).toBe(1.5);

    // Zoom out once
    fireEvent.click(zoomOutButton);
    expect(useChartStore.getState().zoom).toBe(1.25);

    // Reset
    const resetButton = screen.getByTitle('Reset zoom to 100% (Ctrl+0)');
    fireEvent.click(resetButton);
    expect(useChartStore.getState().zoom).toBe(1.0);
  });

  it('should show all preset zoom levels in dropdown', () => {
    render(<ZoomToolbar />);

    const dropdown = screen.getByLabelText('Zoom level') as HTMLSelectElement;
    const options = Array.from(dropdown.options).map(opt => opt.value);

    expect(options).toContain('50');
    expect(options).toContain('75');
    expect(options).toContain('100');
    expect(options).toContain('125');
    expect(options).toContain('150');
    expect(options).toContain('200');
    expect(options).toContain('250');
    expect(options).toContain('300');
    expect(options).toContain('fit');
  });
});
