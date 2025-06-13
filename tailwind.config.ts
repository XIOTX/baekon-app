import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'cal-sans': ['Cal Sans', 'system-ui', 'sans-serif'], // Primary
        'red-hat': ['Red Hat Display', 'system-ui', 'sans-serif'], // Secondary
        'syne-mono': ['Syne Mono', 'monospace'], // Tertiary
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
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
        // BÆKON neon colors
        neon: {
          pink: '#ff0080',
          blue: '#0080ff',
          purple: '#8000ff',
          aqua: '#00ffff',
          green: '#00ff80',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        'neon-pink': '0 0 20px #ff0080, 0 0 40px #ff0080, 0 0 60px #ff0080',
        'neon-blue': '0 0 20px #0080ff, 0 0 40px #0080ff, 0 0 60px #0080ff',
        'neon-purple': '0 0 20px #8000ff, 0 0 40px #8000ff, 0 0 60px #8000ff',
        'neon-aqua': '0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #00ffff',
        'inner-dark': 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor' },
          '100%': { textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
          '50%': { boxShadow: '0 0 30px currentColor, 0 0 60px currentColor' },
        },
      },
      container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
