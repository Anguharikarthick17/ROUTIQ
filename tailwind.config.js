/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        routiq: {
          yellow: '#FFF21A',
          black: '#171717',
          lavender: '#A65BFF',
          white: '#FFFFFF',
          gray: '#A3A3A3',
          surface: '#202020',
          surfaceHover: '#282828',
          border: '#383838',
          borderSubtle: '#2a2a2a',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Space Grotesk', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
