/** @type {import('tailwindcss').Config} */
module.exports = {
  // This ensures we're looking at both the app code and the UI package
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  // Extend UI package config
  presets: [require("../../packages/ui/tailwind.config.js")],
  theme: {
    extend: {
      colors: {
        'primary-button': 'var(--color-primary)',
        'primary-button-hover': 'var(--color-primary-hover)',
        'primary-button-active': 'var(--color-primary-active)',
      },
    },
  },
  plugins: [],
}; 