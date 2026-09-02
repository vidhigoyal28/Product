/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f6',
          500: '#0e87eb',
          600: '#0269c9',
          700: '#0354a2',
          800: '#074785',
          900: '#0c3b6e',
          950: '#082548',
        },
        metrology: {
          navy: '#0f1e36',
          slate: '#1e293b',
          amber: '#f59e0b',
          emerald: '#10b981',
          crimson: '#ef4444',
          indigo: '#4f46e5',
        }
      },
    },
  },
  plugins: [],
}
