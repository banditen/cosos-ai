import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			accent: {
  				beige: '#E6E0D4',
  				lavender: '#D3C9FF',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			foreground: 'hsl(var(--foreground))',
  			action: '#3B46F1',
  			primary: {
  				'50': '#f0f4ff',
  				'100': '#e0e9ff',
  				'200': '#c7d7fe',
  				'300': '#a5bbfc',
  				'400': '#8196f8',
  				'500': '#3B46F1',
  				'600': '#3239d9',
  				'700': '#2a2eb8',
  				'800': '#252895',
  				'900': '#232679',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#faf9f7',
  				'100': '#f5f3ef',
  				'200': '#ebe7dd',
  				'300': '#E6E0D4',
  				'400': '#d4cbb9',
  				'500': '#c2b69e',
  				'600': '#a89a7f',
  				'700': '#8d7f66',
  				'800': '#756a55',
  				'900': '#625949',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: [
  				'Space Grotesk',
  				'system-ui',
  				'sans-serif'
  			],
  			body: [
  				'Figtree',
  				'system-ui',
  				'sans-serif'
  			],
  			sans: [
  				'Figtree',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		spacing: {
  			xs: '4px',
  			sm: '8px',
  			md: '16px',
  			lg: '24px',
  			xl: '32px',
  			'2xl': '48px',
  			'3xl': '64px',
  			'4xl': '96px'
  		},
  		borderRadius: {
  			button: '24px',
  			card: '16px',
  			input: '12px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		maxWidth: {
  			content: '1280px',
  			text: '720px'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
export default config

