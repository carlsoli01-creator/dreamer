/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#07080a',
        bg2: '#0c0e12',
        accent: '#ff3b3b',
        accent2: '#6ae3ff',
        good: '#5fffa6',
        warn: '#ffcc55',
      },
    },
  },
  plugins: [],
};
