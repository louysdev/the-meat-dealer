/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#DC2626',
          500: '#B91C1C',
        },
      },
      animation: {
        'float-up': 'floatUp 8s ease-in-out infinite',
      },
      keyframes: {
        floatUp: {
          '0%': {
            transform: 'translateY(100vh) scale(0)',
            opacity: '0',
          },
          '10%': {
            opacity: '1',
          },
          '90%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(-20vh) scale(1)',
            opacity: '0',
          },
        },
      },
      boxShadow: {
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};