/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'sans-serif']
      },
      colors: {
        ignite: {
          bg: '#0D0000',
          card: '#1A0000',
          sidebar: '#110000',
          red: '#CC0000',
          hover: '#FF1A1A',
          alert: '#FF4444',
          success: '#00C853',
          warning: '#FFB300',
          text: '#F5F5F5',
          muted: '#B0A0A0',
          border: '#2D0000',
          bhover: '#660000'
        }
      },
      boxShadow: {
        'ignite-card': '0 4px 20px rgba(204, 0, 0, 0.15)',
        'ignite-focus': '0 0 0 3px rgba(204, 0, 0, 0.2)'
      }
    },
  },
  plugins: [],
}
