/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['VT323', 'Share Tech Mono', 'JetBrains Mono', 'monospace'],
        sans: ['Share Tech Mono', 'Inter', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'VT323', 'monospace'],
      },
      colors: {
        bg: '#040810',
        panel: '#0a1018',
        line: '#1a2638',
        phosphor: '#00ffaa',
        amber: '#ff9933',
        alert: '#ff2244',
        cyan: '#66ccff',
        dim: '#3a4a60',
      },
      keyframes: {
        flicker: { '0%,100%':{opacity:'1'}, '8%':{opacity:'.85'}, '9%':{opacity:'1'}, '12%':{opacity:'.7'}, '13%':{opacity:'1'}, '70%':{opacity:'.92'}, '72%':{opacity:'1'} },
        scan:    { '0%':{transform:'translateY(-100%)'}, '100%':{transform:'translateY(100%)'} },
        blink:   { '0%,49%':{opacity:'1'}, '50%,100%':{opacity:'.2'} },
        boot:    { '0%':{opacity:'0',transform:'scale(0.98)'}, '40%':{opacity:'1'}, '100%':{opacity:'1',transform:'scale(1)'} },
        sweep:   { '0%':{transform:'rotate(0deg)'}, '100%':{transform:'rotate(360deg)'} },
        rec:     { '0%,49%':{opacity:'1'}, '50%,100%':{opacity:'.15'} },
      },
      animation: {
        flicker: 'flicker 4s infinite',
        scan: 'scan 6s linear infinite',
        blink: 'blink 1s step-end infinite',
        boot: 'boot 0.6s ease-out',
        sweep: 'sweep 5s linear infinite',
        rec: 'rec 1.2s step-end infinite',
      },
    },
  },
  plugins: [],
};
