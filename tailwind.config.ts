import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Devil's Advocate
        believer: {
          DEFAULT: '#0EA5E9',
          hover: '#0284C7',
          foreground: '#FFFFFF',
          bg: '#E0F2FE',
          border: '#7DD3FC',
        },
        skeptic: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          foreground: '#FFFFFF',
          bg: '#FEE2E2',
          border: '#FCA5A5',
        },
        judge: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          foreground: '#FFFFFF',
          bg: '#EDE9FE',
          border: '#C4B5FD',
        },
        // Extended background levels
        'background-secondary': '#171717',
        'background-tertiary': '#262626',
        // Extended foreground levels
        'foreground-secondary': '#E5E5E5',
        'foreground-muted': '#A3A3A3',
      },
    },
  },
  plugins: [],
};

export default config;
