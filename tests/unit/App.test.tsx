import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../../src/App';

describe('App', () => {
  // Set up localStorage to skip welcome tour and avoid chart settings dialog
  beforeEach(() => {
    // Mark welcome as seen to skip the tour
    localStorage.setItem('ownchart-welcome-dismissed', 'true');
    // Set UI state to prevent dialogs from opening automatically
    localStorage.setItem('ownchart-ui', JSON.stringify({
      state: {
        hasSeenWelcome: true,
        isHydrated: true,
        chartSettingsDialogOpen: false,
      },
      version: 0,
    }));
    // Set file state to simulate having a file loaded
    localStorage.setItem('ownchart-file', JSON.stringify({
      state: {
        fileName: 'test.ownchart',
        isDirty: false,
      },
      version: 0,
    }));
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
  });

  it('shows TaskTable component', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
  });

  it('shows ZoomControls in View tab (Sprint 1.2 Package 3)', () => {
    render(<App />);
    // Click on View tab to see zoom controls
    const viewTab = screen.getByRole('tab', { name: /view/i });
    fireEvent.click(viewTab);
    // Check for zoom controls from Sprint 1.2 Package 3 in the app toolbar
    expect(screen.getByTitle('Zoom In (Ctrl++)')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out (Ctrl+-)')).toBeInTheDocument();
    expect(screen.getByTitle('Fit to width')).toBeInTheDocument();
  });

  it('shows undo/redo buttons', () => {
    render(<App />);
    expect(screen.getByLabelText(/nothing to undo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nothing to redo/i)).toBeInTheDocument();
  });
});
