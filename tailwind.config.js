/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        saffron: {
          50: '#fff8f0',
          100: '#fff0dc',
          200: '#ffddb8',
          300: '#ffc48a',
          400: '#f4a261',
          500: '#e76f51',
          600: '#c45135',
          700: '#9e3a24',
          800: '#7a2d1c',
          900: '#5a2015',
        },
        cream: {
          50: '#fffdf9',
          100: '#fffbf5',
          200: '#faf7f2',
          300: '#f2ebe3',
          400: '#e4d6c8',
          500: '#d6c2ae',
        },
      },
    },
  },
  plugins: [],
}
