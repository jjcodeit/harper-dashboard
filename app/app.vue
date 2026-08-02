<script setup>
const { locale } = useDashboardFormat()

useHead(() => ({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: locale.value.split('-')[0] || 'en'
  },
  bodyAttrs: {
    class: 'bg-default text-default'
  }
}))

useSeoMeta({
  title: 'Harper\'s Table — Your portfolio in plain English',
  description: 'A clear view of what your money is doing, why each investment is held, and what deserves attention.'
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
