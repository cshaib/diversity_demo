/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'highlight-pulse': 'highlight-pulse 2s ease-in-out',
      },
      keyframes: {
        'highlight-pulse': {
          '0%, 100%': { backgroundColor: 'rgb(219 234 254)', borderColor: 'rgb(191 219 254)' },
          '50%': { backgroundColor: 'rgb(147 197 253)', borderColor: 'rgb(96 165 250)' }
        }
      }
    },
  },
  plugins: [],
}