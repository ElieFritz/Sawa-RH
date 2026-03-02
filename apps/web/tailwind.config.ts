import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        border: 'hsl(var(--border))',
        card: 'hsl(var(--card))',
      },
      boxShadow: {
        glow: '0 30px 80px rgba(15, 23, 42, 0.14)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(circle at top right, rgba(251, 146, 60, 0.28), transparent 32%), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.18), transparent 35%)',
      },
    },
  },
  plugins: [],
};

export default config;
