import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
  });

  it('shows TaskTable component', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
  });

  it('shows ZoomControls in app toolbar (Sprint 1.2 Package 3)', () => {
    render(<App />);
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
