/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sav: {
          primary: '#1a1f36',
          accent: '#1a1f36',
          success: '#00C853',
          mint: '#00C853',
          dark: '#0d101d',
          vip: '#1a1f36',
          vipLight: '#2a2f46',
        }
      }
    },
  },
  plugins: [],
}
