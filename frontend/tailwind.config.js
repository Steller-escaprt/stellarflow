export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stellar: {
          blue: '#3E1BDB',
          indigo: '#3E1BDB',
          purple: '#7B61FF',
          cyan: '#00E5FF',
          dark: '#0B0D17',
          surface: '#141627',
          card: 'rgba(20, 22, 39, 0.72)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(123, 97, 255, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(0, 229, 255, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
