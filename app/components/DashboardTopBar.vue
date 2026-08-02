<script setup lang="ts">
import { computed } from 'vue'

const colorMode = useColorMode()

const props = defineProps<{
  lastUpdated?: string | null
  preferredName?: string | null
}>()

const isDark = computed(() => colorMode.value === 'dark')

const toggleColorMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const { date: fmtDate } = useDashboardFormat()

const today = computed(() => {
  const now = new Date()
  return fmtDate(now)
})
</script>

<template>
  <header class="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-subtle bg-canvas/95 px-4 backdrop-blur md:px-6 lg:ml-64 lg:px-8">
    <div class="flex items-center gap-3 lg:hidden">
      <div class="flex size-8 items-center justify-center rounded-lg gradient-violet text-white">
        <UIcon
          name="i-lucide-brain-circuit"
          class="size-5"
        />
      </div>
      <span class="text-lg font-semibold tracking-tight text-bright">Harper</span>
    </div>

    <div class="hidden items-center gap-2 text-sm text-faint lg:flex">
      <UIcon
        name="i-lucide-calendar"
        class="size-4"
      />
      <span>{{ today }}</span>
      <span class="mx-2">·</span>
      <span>Snapshot {{ fmtDate(props.lastUpdated) }}</span>
    </div>

    <div class="flex items-center gap-2 sm:gap-3">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleColorMode"
      />
      <div class="flex items-center gap-2.5 rounded-full border border-subtle bg-elevated px-2 py-1 pl-1">
        <div class="flex size-7 items-center justify-center rounded-full bg-accented text-primary">
          <UIcon
            name="i-lucide-user"
            class="size-4"
          />
        </div>
        <span class="hidden pr-2 text-sm font-medium text-bright sm:inline">{{ preferredName || 'Portfolio owner' }}</span>
      </div>
    </div>
  </header>
</template>
