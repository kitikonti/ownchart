import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../../src/store/slices/uiSlice';

describe('uiSlice', () => {
  beforeEach(() => {
    // Reset store before each test
    useUIStore.setState({
      isExportDialogOpen: false,
      isExporting: false,
      exportError: null,
      exportOptions: {
        timelineZoom: 1.0,
        selectedColumns: [],
        includeHeader: true,
        includeTodayMarker: true,
        includeDependencies: true,
        includeGridLines: true,
        includeWeekends: true,
        background: 'white',
      },
      isHelpPanelOpen: false,
      isWelcomeTourOpen: false,
      hasSeenWelcome: false,
      hasTourCompleted: false,
    });
  });

  describe('help panel', () => {
    it('should open help panel', () => {
      const { openHelpPanel } = useUIStore.getState();
      openHelpPanel();

      expect(useUIStore.getState().isHelpPanelOpen).toBe(true);
    });

    it('should close help panel', () => {
      useUIStore.setState({ isHelpPanelOpen: true });
      const { closeHelpPanel } = useUIStore.getState();
      closeHelpPanel();

      expect(useUIStore.getState().isHelpPanelOpen).toBe(false);
    });

    it('should toggle help panel', () => {
      const { toggleHelpPanel } = useUIStore.getState();

      toggleHelpPanel();
      expect(useUIStore.getState().isHelpPanelOpen).toBe(true);

      toggleHelpPanel();
      expect(useUIStore.getState().isHelpPanelOpen).toBe(false);
    });
  });

  describe('export dialog', () => {
    it('should have correct initial state', () => {
      expect(useUIStore.getState().isExportDialogOpen).toBe(false);
      expect(useUIStore.getState().isExporting).toBe(false);
      expect(useUIStore.getState().exportError).toBeNull();
    });

    it('should update export options', () => {
      const { setExportOptions } = useUIStore.getState();
      setExportOptions({ timelineZoom: 1.5, includeHeader: false });

      const state = useUIStore.getState();
      expect(state.exportOptions.timelineZoom).toBe(1.5);
      expect(state.exportOptions.includeHeader).toBe(false);
      // Other options should remain unchanged
      expect(state.exportOptions.background).toBe('white');
    });

    it('should set exporting state', () => {
      const { setIsExporting } = useUIStore.getState();
      setIsExporting(true);

      expect(useUIStore.getState().isExporting).toBe(true);
    });

    it('should clear error when starting export', () => {
      useUIStore.setState({ exportError: 'Previous error' });
      const { setIsExporting } = useUIStore.getState();
      setIsExporting(true);

      expect(useUIStore.getState().exportError).toBeNull();
    });

    it('should set export error', () => {
      const { setExportError } = useUIStore.getState();
      setExportError('Export failed');

      expect(useUIStore.getState().exportError).toBe('Export failed');
    });

    it('should open export dialog', () => {
      const { openExportDialog } = useUIStore.getState();
      openExportDialog();

      expect(useUIStore.getState().isExportDialogOpen).toBe(true);
    });

    it('should close export dialog and reset state', () => {
      useUIStore.setState({
        isExportDialogOpen: true,
        isExporting: true,
        exportError: 'Some error',
      });

      const { closeExportDialog } = useUIStore.getState();
      closeExportDialog();

      expect(useUIStore.getState().isExportDialogOpen).toBe(false);
      expect(useUIStore.getState().isExporting).toBe(false);
      expect(useUIStore.getState().exportError).toBeNull();
    });

    it('should reset export options to defaults', () => {
      // Modify options first
      const { setExportOptions, resetExportOptions } = useUIStore.getState();
      setExportOptions({
        timelineZoom: 2.5,
        includeHeader: false,
        includeGridLines: false,
      });

      // Reset to defaults
      resetExportOptions();

      const state = useUIStore.getState();
      expect(state.exportOptions.timelineZoom).toBe(1.0);
      expect(state.exportOptions.includeHeader).toBe(true);
      expect(state.exportOptions.includeGridLines).toBe(true);
      expect(state.exportOptions.background).toBe('white');
    });

    it('should reset export options to provided options', () => {
      const customOptions = {
        timelineZoom: 1.5,
        selectedColumns: ['name', 'startDate'] as const,
        includeHeader: false,
        includeTodayMarker: false,
        includeDependencies: false,
        includeGridLines: false,
        includeWeekends: false,
        background: 'transparent' as const,
      };

      const { resetExportOptions } = useUIStore.getState();
      resetExportOptions(customOptions);

      const state = useUIStore.getState();
      expect(state.exportOptions.timelineZoom).toBe(1.5);
      expect(state.exportOptions.selectedColumns).toEqual(['name', 'startDate']);
      expect(state.exportOptions.includeHeader).toBe(false);
      expect(state.exportOptions.background).toBe('transparent');
    });
  });

  describe('welcome tour', () => {
    it('should open welcome tour', () => {
      const { openWelcomeTour } = useUIStore.getState();
      openWelcomeTour();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(true);
    });

    it('should close welcome tour', () => {
      useUIStore.setState({ isWelcomeTourOpen: true });
      const { closeWelcomeTour } = useUIStore.getState();
      closeWelcomeTour();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
    });

    it('should dismiss welcome without marking as seen when not permanent', () => {
      useUIStore.setState({ isWelcomeTourOpen: true, hasSeenWelcome: false });
      const { dismissWelcome } = useUIStore.getState();
      dismissWelcome(false);

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
      expect(useUIStore.getState().hasSeenWelcome).toBe(false);
    });

    it('should dismiss welcome and mark as seen when permanent', () => {
      useUIStore.setState({ isWelcomeTourOpen: true, hasSeenWelcome: false });
      const { dismissWelcome } = useUIStore.getState();
      dismissWelcome(true);

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
      expect(useUIStore.getState().hasSeenWelcome).toBe(true);
    });
  });
});
