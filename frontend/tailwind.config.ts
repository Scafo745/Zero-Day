import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F0F0F0',
        'stark-black': '#121212',
        'bauhaus-red': '#D02020',
        'bauhaus-blue': '#1040C0',
        'bauhaus-yellow': '#F0C020',
        'bauhaus-muted': '#E0E0E0',
        'yellow-tint': '#FFF9C4',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'hard-sm': '3px 3px 0px 0px #121212',
        'hard': '4px 4px 0px 0px #121212',
        'hard-md': '6px 6px 0px 0px #121212',
        'hard-lg': '8px 8px 0px 0px #121212',
      },
      borderWidth: {
        '2': '2px',
        '4': '4px',
      },
    },
  },
  plugins: [],
};

export default config;
