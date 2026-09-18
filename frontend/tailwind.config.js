/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cine-bg': '#0B0F19',
        'cine-card': '#1E293B',
        'cine-border': '#334155',
        'cine-brand': '#EAB308', // Popcorn Gold / Amber
        'cine-brand-hover': '#CA8A04',
        'cine-muted': '#94A3B8',
        'cine-red': '#E11D48', // Cinema Red
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}