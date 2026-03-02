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
        /* From COLOR_PALETTE.jpg: 1=blue, 2=slate, 3=brown, 4=sky, 5=cream, 6=green */
        palette: {
          blue: '#1565C0',
          slate: '#546E7A',
          brown: '#5D4037',
          sky: '#B3E5FC',
          cream: '#FFF8E1',
          green: '#6B8E23',
        },
        oa: {
          green: {
            light: '#8BC34A',
            DEFAULT: '#6B8E23',
            dark: '#558B2F',
          },
          blue: {
            light: '#B3E5FC',
            DEFAULT: '#1565C0',
            dark: '#0D47A1',
          },
          brown: {
            light: '#8D6E63',
            DEFAULT: '#5D4037',
            dark: '#3E2723',
          },
          cream: '#FFF8E1',
          slate: '#546E7A',
          sky: '#B3E5FC',
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        'elevated': '0 10px 40px -10px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'card-float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-8px) scale(1.02)' },
        },
        'text-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'text-fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'card-float': 'card-float 4s ease-in-out infinite',
        'text-float': 'text-float 3s ease-in-out infinite',
        'text-fade-in-up': 'text-fade-in-up 0.6s ease-out forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
