const nativewind = require('nativewind/tailwind')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2930A6',
        secondary: '#FFCF0D',
        gray: {
          light: '#666666',
          medium: '#595959',
          dark: '#371B34',
        },
      },
    },
  },
  presets: [nativewind],
}

