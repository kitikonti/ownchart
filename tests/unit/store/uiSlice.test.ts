import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../../src/store/slices/uiSlice';
import {
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_PDF_OPTIONS,
  DEFAULT_SVG_OPTIONS,
} from '../../../src/utils/export/types';

describe('uiSlice', () => {
  beforeEach(() => {
    localStorage.clear();

    // Reset store before each test
    useUIStore.setState({
      isExportDialogOpen: false,
      selectedExportFormat: 'png',
      isExporting: false,
      exportError: null,
      exportProgress: 0,
      exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
      pdfExportOptions: { ...DEFAULT_PDF_OPTIONS },
      svgExportOptions: { ...DEFAULT_SVG_OPTIONS },
      isHelpPanelOpen: false,
      helpDialogActiveTab: 'getting-started',
      isAboutDialogOpen: false,
      isWelcomeTourOpen: false,
      hasSeenWelcome: false,
      hasTourCompleted: false,
      isHydrated: false,
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

  describe('about dialog', () => {
    it('should open about dialog', () => {
      const { openAboutDialog } = useUIStore.getState();
      openAboutDialog();

      expect(useUIStore.getState().isAboutDialogOpen).toBe(true);
    });

    it('should close about dialog', () => {
      useUIStore.setState({ isAboutDialogOpen: true });
      const { closeAboutDialog } = useUIStore.getState();
      closeAboutDialog();

      expect(useUIStore.getState().isAboutDialogOpen).toBe(false);
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

    it('should clear error and reset progress when opening export dialog', () => {
      useUIStore.setState({ exportError: 'Previous error', exportProgress: 75 });
      const { openExportDialog } = useUIStore.getState();
      openExportDialog();

      expect(useUIStore.getState().exportError).toBeNull();
      expect(useUIStore.getState().exportProgress).toBe(0);
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

    it('should persist dismissal to localStorage when permanent', () => {
      useUIStore.setState({ isWelcomeTourOpen: true });
      const { dismissWelcome } = useUIStore.getState();
      dismissWelcome(true);

      expect(localStorage.getItem('ownchart-welcome-dismissed')).toBe('true');
    });

    it('should not persist dismissal to localStorage when not permanent', () => {
      useUIStore.setState({ isWelcomeTourOpen: true });
      const { dismissWelcome } = useUIStore.getState();
      dismissWelcome(false);

      expect(localStorage.getItem('ownchart-welcome-dismissed')).toBeNull();
    });

    it('should complete tour and persist to localStorage', () => {
      useUIStore.setState({ isWelcomeTourOpen: true });
      const { completeTour } = useUIStore.getState();
      completeTour();

      const state = useUIStore.getState();
      expect(state.isWelcomeTourOpen).toBe(false);
      expect(state.hasSeenWelcome).toBe(true);
      expect(state.hasTourCompleted).toBe(true);
      expect(localStorage.getItem('ownchart-welcome-dismissed')).toBe('true');
      expect(localStorage.getItem('ownchart-tour-completed')).toBe('true');
    });

    it('should show welcome tour for first-time users', () => {
      useUIStore.setState({ hasSeenWelcome: false, isWelcomeTourOpen: false });
      const { checkFirstTimeUser } = useUIStore.getState();
      checkFirstTimeUser();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(true);
    });

    it('should not show welcome tour if already seen', () => {
      useUIStore.setState({ hasSeenWelcome: true, isWelcomeTourOpen: false });
      const { checkFirstTimeUser } = useUIStore.getState();
      checkFirstTimeUser();

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
    });
  });

  describe('export format', () => {
    it('should set export format', () => {
      const { setExportFormat } = useUIStore.getState();
      setExportFormat('pdf');

      expect(useUIStore.getState().selectedExportFormat).toBe('pdf');
    });
  });

  describe('export progress', () => {
    it('should set export progress', () => {
      const { setExportProgress } = useUIStore.getState();
      setExportProgress(50);

      expect(useUIStore.getState().exportProgress).toBe(50);
    });

    it('should reset progress when starting export', () => {
      useUIStore.setState({ exportProgress: 75 });
      const { setIsExporting } = useUIStore.getState();
      setIsExporting(true);

      expect(useUIStore.getState().exportProgress).toBe(0);
    });

    it('should stop exporting when setting error', () => {
      useUIStore.setState({ isExporting: true });
      const { setExportError } = useUIStore.getState();
      setExportError('Something went wrong');

      expect(useUIStore.getState().isExporting).toBe(false);
      expect(useUIStore.getState().exportError).toBe('Something went wrong');
    });
  });

  describe('PDF export options', () => {
    it('should update PDF export options partially', () => {
      const { setPdfExportOptions } = useUIStore.getState();
      setPdfExportOptions({ pageSize: 'a3', orientation: 'portrait' });

      const state = useUIStore.getState();
      expect(state.pdfExportOptions.pageSize).toBe('a3');
      expect(state.pdfExportOptions.orientation).toBe('portrait');
      // Other options should remain unchanged
      expect(state.pdfExportOptions.marginPreset).toBe('normal');
    });
  });

  describe('SVG export options', () => {
    it('should update SVG export options partially', () => {
      const { setSvgExportOptions } = useUIStore.getState();
      setSvgExportOptions({ optimize: true, textMode: 'path' });

      const state = useUIStore.getState();
      expect(state.svgExportOptions.optimize).toBe(true);
      expect(state.svgExportOptions.textMode).toBe('path');
      // Other options should remain unchanged
      expect(state.svgExportOptions.preserveAspectRatio).toBe(true);
    });
  });

  describe('help dialog tab', () => {
    it('should set active help tab', () => {
      const { setHelpDialogActiveTab } = useUIStore.getState();
      setHelpDialogActiveTab('shortcuts');

      expect(useUIStore.getState().helpDialogActiveTab).toBe('shortcuts');
    });
  });

  describe('hydration', () => {
    it('should set hydrated state', () => {
      expect(useUIStore.getState().isHydrated).toBe(false);

      const { setHydrated } = useUIStore.getState();
      setHydrated();

      expect(useUIStore.getState().isHydrated).toBe(true);
    });
  });
});
