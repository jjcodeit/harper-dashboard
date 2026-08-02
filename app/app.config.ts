export default defineAppConfig({
  ui: {
    colors: {
      primary: 'harvest',
      secondary: 'teal',
      neutral: 'stone'
    },
    card: {
      slots: {
        root: 'overflow-visible rounded-[10px] border border-default shadow-[0_16px_40px_-32px_rgba(33,48,40,0.45)]'
      }
    },
    button: {
      slots: {
        base: 'rounded-xl'
      }
    },
    badge: {
      slots: {
        base: 'rounded-full'
      }
    },
    input: {
      slots: {
        base: 'rounded-xl'
      }
    }
  }
})
