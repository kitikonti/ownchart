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
        // Brand (Outlook Blue - derived from MS Fluent themePrimary #0F6CBD)
        brand: {
          50: '#EBF3FC',   // themeLighterAlt - light backgrounds
          100: '#CFE4FA',  // themeLighter - focus rings
          200: '#B4D6FA',  // themeLight - disabled states
          300: '#62ABF5',  // themeTertiary - light accents
          400: '#2B88D8',  // themeSecondary - icons, highlights
          500: '#115EA3',  // themeDarkAlt - hover states
          600: '#0F6CBD',  // themePrimary - primary buttons
          700: '#0F548C',  // themeDark - links/text
          800: '#0C3B5E',  // themeDarker - pressed states
          900: '#0A2E4A',  // darker - dark emphasis
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
        focus: '0 0 0 2px #CFE4FA',
        'focus-brand': '0 0 0 2px #0F6CBD',
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
