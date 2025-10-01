/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0a0a0a',
          card: '#121212',
          border: '#1f1f1f',
          text: '#e5e5e5',
          mute: '#9ca3af'
        }
      }
    },
  },
  plugins: [],
}

