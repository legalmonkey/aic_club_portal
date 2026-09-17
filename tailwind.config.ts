import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AIC Brand Identity (NIS-01) Official Colors
        'electric-blue': '#3187E8',
        'light-blue': '#69ACFF',
        'deep-navy': '#0B1726',
        'navy-surface': '#14283D',
        'tech-grey': '#969696',
        'light-grey': '#E8EDF3',
        'off-white': '#F7F9FC',

        // Unified semantic surface & token mapping
        surface: '#F7F9FC',
        'surface-dim': '#E8EDF3',
        'surface-bright': '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F7F9FC',
        'surface-container': '#E8EDF3',
        'surface-container-high': '#DFE6EF',
        'surface-container-highest': '#D3DCE8',
        'on-surface': '#0B1726',
        'on-surface-variant': '#4A5568',
        'inverse-surface': '#0B1726',
        'inverse-on-surface': '#FFFFFF',
        outline: '#969696',
        'outline-variant': '#E8EDF3',
        'surface-tint': '#3187E8',

        // Primary: Electric Blue
        primary: '#3187E8',
        'on-primary': '#FFFFFF',
        'primary-container': '#2574D0',
        'on-primary-container': '#E8F2FD',
        'inverse-primary': '#69ACFF',
        'primary-fixed': '#E8F2FD',
        'primary-fixed-dim': '#CDE3FE',
        'on-primary-fixed': '#0B1726',
        'on-primary-fixed-variant': '#1E5BB5',

        // Secondary: Light Blue / Circuit Accents
        secondary: '#3187E8',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#69ACFF',
        'on-secondary-container': '#0B1726',
        'secondary-fixed': '#E8F2FD',
        'secondary-fixed-dim': '#CDE3FE',
        'on-secondary-fixed': '#0B1726',
        'on-secondary-fixed-variant': '#3187E8',

        // Tertiary: Deep Navy & Dark Surfaces
        tertiary: '#0B1726',
        'on-tertiary': '#FFFFFF',
        'tertiary-container': '#14283D',
        'on-tertiary-container': '#E8EDF3',
        'tertiary-fixed': '#E8EDF3',
        'tertiary-fixed-dim': '#D3DCE8',
        'on-tertiary-fixed': '#0B1726',
        'on-tertiary-fixed-variant': '#14283D',

        background: '#F7F9FC',
        'on-background': '#0B1726',
        'surface-variant': '#E8EDF3',

        error: '#D32F2F',
        'on-error': '#FFFFFF',
        'error-container': '#FFEBEE',
        'on-error-container': '#C62828',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        'gutter': '1.5rem',
        'gutter-desktop': '1.5rem',
        'space-gutter-desktop': '1.5rem',
        'gutter-mobile': '1rem',
        'margin': '2rem',
        'margin-desktop': '2.5rem',
        'margin-tablet': '1.5rem',
        'margin-mobile': '1rem',
        'space-2xs': '0.25rem',
        'space-xs': '0.5rem',
        'space-sm': '0.75rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        'space-2xl': '2.5rem',
        'space-3xl': '3rem',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
