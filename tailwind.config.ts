import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        panel: '#111215',
        panelElevated: '#17191f',
        border: '#242833',
        textPrimary: '#e7ebf3',
        textSecondary: '#9aa4b5',
        accent: '#4f7cff',
        success: '#2fbb74',
        warning: '#f0a23d'
      },
      boxShadow: {
        soft: '0 6px 28px rgba(0, 0, 0, 0.25)'
      },
      borderRadius: {
        xl: '14px'
      }
    }
  },
  plugins: []
} satisfies Config;
