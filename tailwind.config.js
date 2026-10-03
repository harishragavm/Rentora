/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rentora: {
          slate: '#0F172A',
          charcoal: '#0B0F17',
          midnight: '#020617',
          teal: '#0D9488',
          tealHover: '#0F766E',
          tealLight: '#F0FDFA',
          emerald: '#10B981',
          amber: '#D97706',
          amberLight: '#FFFBEB',
          porcelain: '#F8FAFC',
          pearl: '#F1F5F9',
          muted: '#64748B',
          border: '#E2E8F0',
          darkBorder: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'premium': '0 20px 40px -15px rgba(15, 23, 42, 0.07), 0 0 1px 1px rgba(15, 23, 42, 0.05)',
        'glow': '0 0 25px -5px rgba(13, 148, 136, 0.25)',
      }
    },
  },
  plugins: [],
}
