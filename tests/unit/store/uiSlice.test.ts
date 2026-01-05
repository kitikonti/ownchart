import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useUIStore } from '../../../src/store/slices/uiSlice';
import { DEFAULT_EXPORT_OPTIONS } from '../../../src/utils/export/types';

describe('uiSlice', () => {
  beforeEach(() => {
    // Reset store before each test
    useUIStore.setState({
      isExportDialogOpen: false,
      exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
      isExporting: false,
      exportError: null,
      isHelpPanelOpen: false,
      isWelcomeTourOpen: false,
      hasSeenWelcome: false,
      hasTourCompleted: false,
    });

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('export dialog', () => {
    it('should open export dialog', () => {
      const { openExportDialog } = useUIStore.getState();
      openExportDialog();

      expect(useUIStore.getState().isExportDialogOpen).toBe(true);
    });

    it('should close export dialog', () => {
      useUIStore.setState({ isExportDialogOpen: true });
      const { closeExportDialog } = useUIStore.getState();
      closeExportDialog();

      expect(useUIStore.getState().isExportDialogOpen).toBe(false);
    });

    it('should clear error when opening export dialog', () => {
      useUIStore.setState({ exportError: 'Previous error' });
      const { openExportDialog } = useUIStore.getState();
      openExportDialog();

      expect(useUIStore.getState().exportError).toBeNull();
    });

    it('should reset state when closing export dialog', () => {
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

    it('should update export options', () => {
      const { setExportOptions } = useUIStore.getState();
      setExportOptions({ width: 2560, includeTaskList: false });

      const state = useUIStore.getState();
      expect(state.exportOptions.width).toBe(2560);
      expect(state.exportOptions.includeTaskList).toBe(false);
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
      expect(useUIStore.getState().isExporting).toBe(false);
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

    it('should dismiss welcome and save preference', () => {
      useUIStore.setState({ isWelcomeTourOpen: true });
      const { dismissWelcome } = useUIStore.getState();
      dismissWelcome();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
      expect(useUIStore.getState().hasSeenWelcome).toBe(true);
      expect(localStorage.getItem('ownchart-welcome-dismissed')).toBe('true');
    });

    it('should complete tour and save preference', () => {
      useUIStore.setState({ isWelcomeTourOpen: true });
      const { completeTour } = useUIStore.getState();
      completeTour();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
      expect(useUIStore.getState().hasSeenWelcome).toBe(true);
      expect(useUIStore.getState().hasTourCompleted).toBe(true);
      expect(localStorage.getItem('ownchart-welcome-dismissed')).toBe('true');
      expect(localStorage.getItem('ownchart-tour-completed')).toBe('true');
    });

    it('should show welcome for first-time users', () => {
      const { checkFirstTimeUser } = useUIStore.getState();
      checkFirstTimeUser();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(true);
    });

    it('should not show welcome if already seen', () => {
      useUIStore.setState({ hasSeenWelcome: true });
      const { checkFirstTimeUser } = useUIStore.getState();
      checkFirstTimeUser();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
    });
  });
});
