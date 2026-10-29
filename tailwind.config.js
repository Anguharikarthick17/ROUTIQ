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
        brand: {
          yellow: '#FFF21A',
          black: '#111111',
          purple: '#A65BFF',
          white: '#FFFFFF',
        },
        text: {
          primary: '#111111',
          secondary: '#45421F',
        },
        surface: {
          primary: '#FFF21A',
          card: '#FFFFFF',
          dark: '#171717',
        },
        border: {
          primary: '#111111',
          subtle: 'rgba(17, 17, 17, 0.18)',
        },
        status: {
          success: '#176B38',
          warning: '#8A4B00',
          danger: '#B42318',
        },
        routiq: {
          yellow: '#FFF21A',
          black: '#111111',
          lavender: '#A65BFF',
          purple: '#A65BFF',
          white: '#FFFFFF',
          gray: '#45421F',
          surface: '#FFFFFF',
          surfaceHover: '#F7F7F7',
          surfaceDark: '#171717',
          border: '#111111',
          borderSubtle: 'rgba(17, 17, 17, 0.18)',
        }
      },
      borderRadius: {
        small: '8px',
        medium: '12px',
        large: '18px',
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

