import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display:  ['"Cormorant Garamond"', 'serif'],
        heading:  ['"Playfair Display"', 'serif'],
        body:     ['"Libre Baskerville"', 'serif'],
        ui:       ['Inter', 'sans-serif'],
      },
      colors: {
        bg:             '#F5F2ED',
        surface:        '#FAFAF8',
        'surface-alt':  '#EFEDE8',
        border:         '#E4E1DA',
        'border-strong':'#C9C5BC',
        text: {
          primary:   '#1A1A18',
          secondary: '#6B6860',
          muted:     '#A8A49C',
        },
        accent:  '#C8513A',
        positive:'#3A7D5C',
        btn:     '#1A1A18',
      },
      borderRadius: {
        sm:   '8px',
        md:   '16px',
        lg:   '24px',
        pill: '999px',
      },
      maxWidth: {
        app: '480px',
      },
    },
  },
} satisfies Config
