import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/gantt chart application/i)).toBeInTheDocument();
  });

  it('displays Sprint 1.1 status', () => {
    render(<App />);
    expect(screen.getByText(/sprint 1\.1: task management mvp/i)).toBeInTheDocument();
  });

  it('shows TaskList component', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
  });

  it('shows timeline placeholder', () => {
    render(<App />);
    expect(screen.getByText(/timeline view/i)).toBeInTheDocument();
    expect(screen.getByText(/coming in sprint 1\.2/i)).toBeInTheDocument();
  });
});
