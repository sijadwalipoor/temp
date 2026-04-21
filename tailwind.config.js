module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#cd3434',      // Brand red
        primaryDark: '#a52828',  // Darker hover variant
        secondary: '#525252',
        dark: '#161616',
        light: '#f4f4f4',
        danger: '#da1e28',
        warning: '#f1c21b',
        success: '#24a148',
        info: '#cd3434',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'ibm-sm': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'ibm-md': '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        'ibm-lg': '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}
