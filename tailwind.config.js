/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        oa: {
          green: {
            light: '#8BC34A',
            DEFAULT: '#4CAF50',
            dark: '#2E7D32',
          },
          blue: {
            light: '#64B5F6',
            DEFAULT: '#2196F3',
            dark: '#1565C0',
          },
          brown: {
            light: '#A1887F',
            DEFAULT: '#6D4C41',
            dark: '#4E342E',
          },
          cream: '#FFF8E1',
        }
      },
    },
  },
  plugins: [],
}
