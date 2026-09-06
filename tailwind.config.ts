// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1536px' } },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
        serif: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'var(--font-sans)', 'sans-serif'],
        condensed: ['var(--font-condensed)', 'Arial Narrow', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'marquee-y': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-50%)' } },
        'marquee-x': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        // The two-row band: the track is duplicated, so -50% lands the second
        // copy exactly where the first started — a seamless loop, no jump.
        'marquee-x-half': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'marquee-x-reverse': { from: { transform: 'translateX(-50%)' }, to: { transform: 'translateX(0)' } },
        'film-scroll': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-50%)' } },
        'marquee-y-reverse': { from: { transform: 'translateY(-50%)' }, to: { transform: 'translateY(0)' } },
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'marquee-y': 'marquee-y var(--marquee-duration, 40s) linear infinite',
        'marquee-y-reverse': 'marquee-y-reverse var(--marquee-duration, 40s) linear infinite',
        'marquee-x': 'marquee-x var(--marquee-duration, 22s) linear infinite',
        'film-scroll': 'film-scroll 28s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
