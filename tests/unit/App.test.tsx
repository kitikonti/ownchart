import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/gantt chart application/i)).toBeInTheDocument();
  });

  it('displays Phase 0 status', () => {
    render(<App />);
    expect(screen.getByText(/phase 0: foundation/i)).toBeInTheDocument();
  });

  it('shows initialization message', () => {
    render(<App />);
    expect(screen.getByText(/project initialized/i)).toBeInTheDocument();
  });
});
