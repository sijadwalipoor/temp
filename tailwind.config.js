module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // IBM Color Palette
        primary: '#0043ce',      // IBM Blue
        primaryDark: '#002d9c',  // Dark IBM Blue
        secondary: '#525252',    // IBM Gray
        dark: '#161616',         // IBM Dark
        light: '#f4f4f4',        // IBM Light Gray
        danger: '#da1e28',       // IBM Red
        warning: '#f1c21b',      // IBM Yellow
        success: '#24a148',      // IBM Green
        info: '#0043ce',         // IBM Blue
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
