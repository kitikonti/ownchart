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

    it('should dismiss welcome and mark as seen', () => {
      useUIStore.setState({ isWelcomeTourOpen: true });
      const { dismissWelcome } = useUIStore.getState();
      dismissWelcome();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
      expect(useUIStore.getState().hasSeenWelcome).toBe(true);
    });
  });
});
