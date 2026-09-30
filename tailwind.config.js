/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d9f1ff',
          200: '#bce7ff',
          300: '#8ed8ff',
          400: '#59c0ff',
          500: '#33a1ff',
          600: '#1a7ff5',
          700: '#1468e1',
          800: '#1754b6',
          900: '#19498f',
        },
      },
    },
  },
  plugins: [],
};
