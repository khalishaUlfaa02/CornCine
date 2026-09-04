/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cine-dark': '#0B1325',
        'cine-card': '#162238',
        'cine-border': '#243452',
        'cine-baby': '#7DD3FC',
        'cine-baby-soft': '#BAE6FD',
        'cine-baby-hover': '#38BDF8',
        'cine-muted': '#94A3B8',
      }
    },
  },
  plugins: [],
}