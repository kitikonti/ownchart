import { neutral, brand, semantic, surface } from './src/styles/colors.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SF Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        neutral,
        brand,
        ...semantic,
        surface,
      },
      spacing: {
        18: '4.5rem',
        72: '18rem',
        84: '21rem',
        96: '24rem',
      },
      borderRadius: {
        sm: '2px', // flat style
        DEFAULT: '4px',
        md: '4px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        // Elevation shadows
        rest: '0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)',
        hover: '0 0 2px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.14)',
        pressed: '0 0 2px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)',
        dropdown: '0 0 8px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.14)',
        // Dialog shadow
        modal: '0 0 8px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.14)',
        // Focus ring
        focus: '0 0 0 2px #CFE4FA',
        'focus-brand': '0 0 0 2px #0F6CBD',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Fluent easing
        fluent: 'cubic-bezier(0.33, 0, 0.67, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 250ms ease-out',
        'modal-in': 'modalIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
