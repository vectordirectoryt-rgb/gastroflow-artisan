/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial "Los Brownies de Josefina"
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
          // Colores Corporativos del Manual de Identidad
          cream: {
            DEFAULT: '#ECEBCF',
            light: '#F5F4E4',
            dark: '#DDDABA',
          },
          chocolate: {
            DEFAULT: '#22221E',
            light: '#3A3A34',
            dark: '#141412',
          },
          sage: {
            DEFAULT: '#B6BD90',
            light: '#CAD0AB',
            dark: '#9FA773',
          },
          lavender: {
            DEFAULT: '#98A1D5',
            light: '#B4BCE2',
            dark: '#7D87C4',
          },
          mauve: {
            DEFAULT: '#A472B9',
            light: '#BA8ECC',
            dark: '#8C57A3',
          },
        }
      }
    },
  },
  plugins: [],
}
