/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:    '#E7EBEA',
        raised:   '#F5F8F7',
        ink:      '#101E1B',
        muted:    '#5C6E6A',
        line:     '#C7D2CF',
        evergreen:'#1F5D4C',
        marigold: '#E2A016',
        clay:     '#A8543C'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body:    ['Newsreader', 'Georgia', 'serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      maxWidth: { reading: '46rem' }
    }
  },
  plugins: []
}
