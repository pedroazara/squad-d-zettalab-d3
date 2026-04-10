export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A3D2B',
        secondary: '#2E6B3E',
        accent: '#5CB85C',
        warning: '#F0AD4E',
        danger: '#D9534F',
        info: '#5BC0DE',
        bg: '#F0F5F1',
        surface: '#FFFFFF',
        text: '#1C1C1E',
        muted: '#6C757D',
        'guarawatch-primary': '#1A3D2B',
        'guarawatch-secondary': '#2E6B3E',
        'guarawatch-accent': '#5CB85C',
        'guarawatch-warning': '#F0AD4E',
        'guarawatch-danger': '#D9534F',
        'guarawatch-info': '#5BC0DE',
        'guarawatch-bg': '#F0F5F1',
        'guarawatch-surface': '#FFFFFF',
        'guarawatch-text': '#1C1C1E',
        'guarawatch-muted': '#6C757D',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        body: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
