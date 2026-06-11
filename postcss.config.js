module.exports = {
  plugins: {
    // Tailwind v4 moved its PostCSS plugin into a dedicated package, and
    // autoprefixer is now bundled in — so it's the only plugin needed.
    "@tailwindcss/postcss": {},
  },
};
