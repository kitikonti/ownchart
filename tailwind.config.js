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
        // Neutrals (MS Fluent - pure grays, no blue tint)
        neutral: {
          0: '#ffffff',
          50: '#f5f5f5',
          100: '#ebebeb',
          200: '#d4d4d4',
          300: '#b3b3b3',
          400: '#8a8a8a',
          500: '#6b6b6b',
          600: '#525252',
          700: '#404040',
          800: '#303030',
          900: '#1a1a1a',
        },
        // Brand (Cyan - single color for all interactive elements)
        // Dark shades use hue rotation toward blue (180° → 195°) to maintain
        // cyan appearance at low lightness (color theory: perceived saturation)
        brand: {
          50: '#E0FFFF',   // H=180°
          100: '#B3FFFF',  // H=180°
          200: '#80FFFF',  // H=180°
          300: '#4DFFFF',  // H=180°
          400: '#00CCCC',  // H=180° (base brand color)
          500: '#00AAB3',  // H=183° (+3° blue shift)
          600: '#008A99',  // H=186° (+6° blue shift) - primary buttons
          700: '#006C80',  // H=189° (+9° blue shift) - text/links
          800: '#005266',  // H=192° (+12° blue shift) - pressed
          900: '#00394D',  // H=195° (+15° blue shift) - dark emphasis
        },
        // Semantic (only for status, not UI)
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#0284c7',
        // Surface colors
        surface: {
          DEFAULT: '#ffffff',
          raised: '#f5f5f5',
          sunken: '#ebebeb',
        },
      },
      spacing: {
        18: '4.5rem',
        72: '18rem',
        84: '21rem',
        96: '24rem',
      },
      borderRadius: {
        sm: '2px', // MS style - very flat
        DEFAULT: '4px',
        md: '4px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        // MS Fluent UI shadows (extracted from computed styles)
        rest: '0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)',
        hover: '0 0 2px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.14)',
        pressed: '0 0 2px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)',
        dropdown: '0 0 8px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.14)',
        // MS Dialog shadow
        modal: '0 0 8px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.14)',
        // Focus ring
        focus: '0 0 0 2px #B3FFFF',
        'focus-brand': '0 0 0 2px #008A99',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        // MS Fluent UI timing function
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
