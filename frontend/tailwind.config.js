/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0f12', // very dark graphite background
        surface: '#16191d',
        surfaceHover: '#1c2025',
        border: '#2a2f36',
        
        // typography
        textPrimary: '#e2e4e9', // muted off-white typography
        textSecondary: '#8a94a6', // desaturated blue/gray secondary information
        
        // accents
        accent: '#a3e635', // lime/yellow-green primary analytical accent
        danger: '#f87171', // coral/red for dangerous conditions
        uncertainty: '#8b5cf6', // violet for uncertainty
        info: '#3b82f6',
        warning: '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 20px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
