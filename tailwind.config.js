/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        // Dark base (sidebar, titlebar)
        'bg-deep':   '#0d1117',
        'bg-surface':'#161b22',
        'bg-card':   '#1c2128',
        'bg-hover':  '#21262d',
        'bg-active': '#282e36',

        // Main content area (slightly lighter)
        'content':   '#f0f2f5',
        'content-card': '#ffffff',

        // Borders
        'border-subtle': '#30363d',
        'border-default':'#21262d',
        'border-light':  '#e1e4e8',

        // Text
        'text-primary':  '#e6edf3',
        'text-secondary':'#8b949e',
        'text-muted':    '#6e7681',
        'text-ink':      '#24292f',

        // Accent — TelVault blue/teal
        'accent':        '#2f81f7',
        'accent-hover':  '#388bfd',
        'accent-muted':  '#1f6feb',

        // Status colors
        'status-new':     '#3fb950',
        'status-modified':'#d29922',
        'status-clean':   '#3fb950',
        'status-error':   '#f85149',
      },
      boxShadow: {
        'panel': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card':  '0 2px 8px rgba(0,0,0,0.2)',
        'popup': '0 8px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
