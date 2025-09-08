import { niobiTheme } from '../shared-components/src/theme/niobi-theme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../reconciliation-tool/src/**/*.{js,ts,jsx,tsx}',
    '../shared-components/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: niobiTheme.colors,
      fontFamily: {
        sans: niobiTheme.typography.fontFamily,
      },
    },
  },
  plugins: [],
};
