// https://nuxt.com/docs/api/configuration/nuxt-config test
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'convex-nuxt'
  ],

  // routeRules: {
  //   '/': { prerender: true }
  // },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-06-30',

  nitro: {
    preset: 'vercel'
  },

  convex: {
    url: process.env.NUXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || ''
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
