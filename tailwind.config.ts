export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        ios: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      colors: {
        ios: {
          bg: '#FFFFFF',
          card: '#F2F2F7',
          cardSecondary: '#E5E5EA',
          border: '#D1D1D6',
          textPrimary: '#000000',
          textSecondary: '#8E8E93',
        },
      },
    },
  },
  plugins: [],
};
