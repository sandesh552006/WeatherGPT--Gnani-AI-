/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          700: "#1a2c50",
          800: "#101f42",
          850: "#0d1a38",
          900: "#0b132b",
          950: "#070b19",
        },
        cardnavy: {
          start: "#0d2144",
          end: "#08162e",
        },
        brand: {
          blue: "#1d68f5",
          purple: "#7c3aed",
          cyan: "#06b6d4",
          lightblue: "#38bdf8",
          darkblue: "#070b19",
        },
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(124, 58, 237, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
};
