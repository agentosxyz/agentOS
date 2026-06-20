import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        acid: '#c8ff00', // brand lime accent
        ink: '#000000',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      boxShadow: {
        acid: '0 0 80px rgba(200,255,0,0.25)',
      },
    },
  },
  plugins: [],
}

export default config
