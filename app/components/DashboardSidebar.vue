<script setup lang="ts">
const route = useRoute()
const items = [
  { label: 'Today', icon: 'i-lucide-sun', target: 'portfolio-overview' },
  { label: 'Your investments', icon: 'i-lucide-sprout', target: 'investments' },
  { label: 'How it is going', icon: 'i-lucide-line-chart', target: 'performance' },
  { label: 'Where the money is', icon: 'i-lucide-wallet-cards', target: 'allocation' },
  { label: 'What Harper considered', icon: 'i-lucide-funnel', target: 'opportunity-funnel' },
  { label: 'Harper’s notes', icon: 'i-lucide-notebook-tabs', target: 'review' },
  { label: 'Usage & cost', icon: 'i-lucide-activity', target: 'usage' }
]

const tools = [
  { label: 'Leverage risk modeler', icon: 'i-lucide-gauge', to: '/risk-modeler' },
  { label: 'Back to portfolio', icon: 'i-lucide-home', to: '/' }
]

const scrollTo = async (id: string) => {
  if (route.path !== '/') {
    // Section links live on the portfolio page; go home first if needed.
    await navigateTo('/')
    await nextTick()
  }
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <aside
    class="table-cloth fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-subtle lg:flex"
    aria-label="Main navigation"
  >
    <div class="flex h-20 items-center gap-3 border-b border-white/70 px-5">
      <div class="flex size-10 items-center justify-center rounded-2xl bg-[#18392f] text-white shadow-sm">
        <UIcon
          name="i-lucide-sprout"
          class="size-5.5"
        />
      </div>
      <span>
        <span class="font-display block text-lg font-bold tracking-tight text-bright">Harper’s Table</span>
        <span class="block text-[11px] font-medium uppercase tracking-[0.14em] text-soft">Money, made clearer</span>
      </span>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-6">
      <p class="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
        On this page
      </p>
      <ul class="space-y-1">
        <li
          v-for="item in items"
          :key="item.target"
        >
          <UButton
            :label="item.label"
            :leading-icon="item.icon"
            color="neutral"
            variant="ghost"
            block
            class="min-h-11 justify-start px-3 text-soft hover:bg-white/70 hover:text-bright"
            @click="scrollTo(item.target)"
          />
        </li>
      </ul>

      <p class="mt-6 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
        Tools
      </p>
      <ul class="space-y-1">
        <li
          v-for="tool in tools"
          :key="tool.to"
        >
          <NuxtLink :to="tool.to">
            <UButton
              :label="tool.label"
              :leading-icon="tool.icon"
              color="neutral"
              variant="ghost"
              block
              class="min-h-11 justify-start px-3 text-soft hover:bg-white/70 hover:text-bright"
              :class="{ 'bg-white/70 text-bright': route.path === tool.to }"
            />
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="border-t border-white/70 p-5">
      <p class="text-xs leading-relaxed text-soft">
        Start with the summary. Open the details only when you want the full story.
      </p>
    </div>
  </aside>
</template>
