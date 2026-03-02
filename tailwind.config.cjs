module.exports = {
  content: [
    './index.html',
    './project.html',
    './experience.html',
    './src/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        glow: '0 30px 120px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
}
