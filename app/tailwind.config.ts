import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Identity Colors
        background: '#F8F8F6',      // Soft ivory white — elegant base
        accent: {
          beige: '#E6E0D4',         // Champagne beige — warmth and sophistication
          lavender: '#D3C9FF',      // Lavender-gray — signals intelligence and tech
        },
        foreground: '#1A1A1A',      // Deep graphite — modern, readable contrast
        action: '#3B46F1',          // Muted electric blue — precision + premium tech energy

        // Legacy primary/secondary for backward compatibility
        primary: {
          DEFAULT: '#3B46F1',
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8196f8',
          500: '#3B46F1',
          600: '#3239d9',
          700: '#2a2eb8',
          800: '#252895',
          900: '#232679',
        },
        secondary: {
          DEFAULT: '#E6E0D4',
          50: '#faf9f7',
          100: '#f5f3ef',
          200: '#ebe7dd',
          300: '#E6E0D4',
          400: '#d4cbb9',
          500: '#c2b69e',
          600: '#a89a7f',
          700: '#8d7f66',
          800: '#756a55',
          900: '#625949',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Figtree', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
      },
      borderRadius: {
        'button': '24px',
        'card': '16px',
        'input': '12px',
      },
      maxWidth: {
        'content': '1280px',
        'text': '720px',
      },
    },
  },
  plugins: [],
}
export default config

