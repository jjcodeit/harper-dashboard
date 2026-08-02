<script setup lang="ts">
import { computed } from 'vue'

type IndexQuote = {
  name: string
  price: number
  change: number
  changePercent: number
}

const props = defineProps<{
  quotes: IndexQuote[]
  loading: boolean
  error: string | null
}>()

const { number: fmt } = useDashboardFormat()
const cards = computed(() => props.quotes)
</script>

<template>
  <section aria-labelledby="market-snapshot-title">
    <div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Market snapshot
        </p>
        <h2
          id="market-snapshot-title"
          class="font-display mt-1 text-xl font-bold tracking-tight text-bright"
        >
          How the market is moving today
        </h2>
      </div>
      <p class="text-xs text-soft">
        Refreshed market data from Yahoo Finance
      </p>
    </div>

    <div
      v-if="cards.length"
      class="grid gap-4 sm:grid-cols-2"
    >
      <UCard
        v-for="card in cards"
        :key="card.name"
        :ui="{ root: 'rounded-[10px] border-subtle bg-surface ring-0', body: 'p-4 md:p-5' }"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-bright">
              {{ card.name }}
            </p>
            <p class="mt-1 text-xs text-soft">
              Last available level
            </p>
          </div>
          <UIcon
            name="i-lucide-chart-no-axes-combined"
            class="size-5 text-primary"
          />
        </div>
        <p class="mt-5 text-2xl font-bold tabular-nums text-bright">
          {{ fmt(card.price) }}
        </p>
        <p
          class="mt-2 text-xs leading-relaxed"
          :class="card.change >= 0 ? 'text-success' : 'text-error'"
        >
          {{ card.change >= 0 ? '+' : '' }}{{ fmt(card.change) }} ({{ card.changePercent >= 0 ? '+' : '' }}{{ fmt(card.changePercent) }}%) today
        </p>
        <div class="mt-4 flex items-center justify-between border-t border-subtle pt-3 text-xs">
          <span class="text-soft">Data source</span>
          <span class="text-default">Yahoo Finance</span>
        </div>
      </UCard>
    </div>
    <UCard
      v-else-if="loading"
      :ui="{ root: 'rounded-[10px] border-subtle bg-surface ring-0', body: 'p-4 text-sm text-soft' }"
    >
      Refreshing the configured benchmark...
    </UCard>
    <UCard
      v-else-if="error"
      :ui="{ root: 'rounded-[10px] border-subtle bg-surface ring-0', body: 'p-4 text-sm text-soft' }"
    >
      {{ error }}
    </UCard>
  </section>
</template>
