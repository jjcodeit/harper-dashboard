<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  enrichedHoldings: any[]
  thesesActive: any[]
  status: any
  mode?: 'overview' | 'remaining'
}>(), {
  mode: 'overview'
})

const emit = defineEmits<{
  navigate: [target: 'positions' | 'exposure' | 'data-status', ticker?: string]
}>()

const { number, money } = useDashboardFormat()
const fmt = (n: number | null | undefined, d = 2) =>
  number(n, { minimumFractionDigits: d, maximumFractionDigits: d })

const stripSuffix = (ticker: string) => ticker.replace(/\.(NS|BO)$/, '')

interface BriefItem {
  kind: 'attention' | 'watch' | 'data'
  badge: 'Needs attention' | 'Worth watching' | 'Data update' | 'All clear'
  title: string
  description: string
  action: string | null
  target: 'positions' | 'exposure' | 'data-status'
  ticker?: string
}

const badgeColor = (kind: BriefItem['kind']) => {
  if (kind === 'attention') return 'error'
  if (kind === 'watch') return 'info'
  return 'warning'
}

const investmentIssue = computed<BriefItem | null>(() => {
  const detractor = [...props.enrichedHoldings]
    .filter((holding: any) => holding.current_pnl < 0)
    .sort((a: any, b: any) => a.current_pnl - b.current_pnl)[0]

  if (detractor) {
    return {
      kind: 'attention',
      badge: 'Needs attention',
      title: `${stripSuffix(detractor.ticker)} has the largest open loss`,
      description: `The position is down ${money(Math.abs(detractor.current_pnl))}. This is the largest loss among investments still held.`,
      action: 'Review investment',
      target: 'positions',
      ticker: detractor.ticker
    }
  }

  const lowConfidence = [...(props.thesesActive ?? [])]
    .filter((thesis: any) => (thesis.confidence ?? 100) < 30)
    .sort((a: any, b: any) => (a.confidence ?? 0) - (b.confidence ?? 0))[0]

  if (lowConfidence) {
    return {
      kind: 'attention',
      badge: 'Needs attention',
      title: `${stripSuffix(lowConfidence.ticker)} has low Harper confidence`,
      description: `Harper's confidence is ${fmt(lowConfidence.confidence, 0)}%. Confidence describes the strength of the current view, not a guaranteed probability of profit.`,
      action: 'Review investment reason',
      target: 'positions',
      ticker: lowConfidence.ticker
    }
  }

  return null
})

const watchItem = computed<BriefItem | null>(() => {
  const nearTargets = (props.thesesActive ?? []).flatMap((thesis: any) => {
    const holding = props.enrichedHoldings.find((candidate: any) => candidate.ticker === thesis.ticker)
    if (!holding || !thesis.target) return []
    const distance = Math.abs((holding.current_price - thesis.target) / thesis.target) * 100
    return distance < 10 ? [{ thesis, holding, distance }] : []
  }).sort((a: any, b: any) => a.distance - b.distance)

  const nearestTarget = nearTargets[0]
  if (nearestTarget) {
    const { thesis, distance } = nearestTarget
    return {
      kind: 'watch',
      badge: 'Worth watching',
      title: `${stripSuffix(thesis.ticker)} is ${fmt(distance, 1)}% from its target price`,
      description: `Harper's current target is ${money(thesis.target)}. Review the investment reason before treating the target as an expected outcome.`,
      action: 'Review target and reason',
      target: 'positions',
      ticker: thesis.ticker
    }
  }

  const grossExposure = props.status?.gross_exposure_pct ?? 0
  if (grossExposure > 100) {
    return {
      kind: 'watch',
      badge: 'Worth watching',
      title: `Gross exposure is ${fmt(grossExposure, 0)}%`,
      description: 'Position size is larger than portfolio value, which can amplify both gains and losses.',
      action: 'Understand exposure',
      target: 'exposure'
    }
  }

  const cashPct = props.status?.nav > 0 ? (props.status.cash / props.status.nav) * 100 : 0
  if (cashPct > 30) {
    return {
      kind: 'watch',
      badge: 'Worth watching',
      title: `${fmt(cashPct, 0)}% of the portfolio is in cash`,
      description: 'Cash is not exposed to price movement and remains available for future investments.',
      action: 'See how money is invested',
      target: 'exposure'
    }
  }

  return null
})

const dataItem = computed<BriefItem | null>(() => {
  const latestRun = props.status?.latest_run
  if (latestRun && latestRun.status !== 'COMPLETED') {
    return {
      kind: 'data',
      badge: 'Data update',
      title: 'The latest portfolio update did not complete',
      description: 'Harper is showing the last available portfolio snapshot. Open Data status for the run details.',
      action: 'Open data status',
      target: 'data-status'
    }
  }

  const storedQuotes = props.enrichedHoldings.filter((holding: any) => !holding.isLive)
  if (storedQuotes.length) {
    return {
      kind: 'data',
      badge: 'Data update',
      title: `${storedQuotes.length} ${storedQuotes.length === 1 ? 'investment needs' : 'investments need'} a price refresh`,
      description: `${storedQuotes.map((holding: any) => stripSuffix(holding.ticker)).join(', ')} ${storedQuotes.length === 1 ? 'is' : 'are'} showing the last available saved price.`,
      action: 'Review quote status',
      target: 'positions',
      ticker: storedQuotes.length === 1 ? storedQuotes[0].ticker : undefined
    }
  }

  return null
})

const items = computed<BriefItem[]>(() => {
  const selected = [investmentIssue.value, watchItem.value, dataItem.value]
    .filter((item): item is BriefItem => item != null)

  if (!selected.length) {
    if (!props.enrichedHoldings.length) {
      return [{
        kind: 'data',
        badge: 'All clear',
        title: 'The portfolio is currently held in cash',
        description: 'There are no open investments to review. Portfolio value and data status remain available below.',
        action: 'See how money is invested',
        target: 'exposure'
      }]
    }

    return [{
      kind: 'watch',
      badge: 'All clear',
      title: 'No urgent investment issues are visible',
      description: 'Open investments, quote freshness, and Harper confidence are within the current review thresholds.',
      action: 'Review investments',
      target: 'positions'
    }]
  }

  return selected.slice(0, 3)
})

const visibleItems = computed(() =>
  props.mode === 'remaining' ? items.value.slice(1) : items.value
)
</script>

<template>
  <UCard
    v-if="visibleItems.length"
    :aria-labelledby="mode === 'remaining' ? 'remaining-brief-title' : 'today-brief-title'"
    :ui="{ root: mode === 'remaining' ? 'overflow-visible rounded-[10px] border-subtle bg-surface ring-0 md:hidden' : 'overflow-visible rounded-[10px] border-subtle bg-surface ring-0', body: 'p-5' }"
  >
    <div class="mb-2.5">
      <h2
        :id="mode === 'remaining' ? 'remaining-brief-title' : 'today-brief-title'"
        class="text-base font-semibold text-bright"
      >
        {{ mode === 'remaining' ? "Also in today's brief" : "Today's brief" }}
      </h2>
      <p class="mt-1 text-xs leading-relaxed text-soft">
        {{ mode === 'remaining' ? 'The remaining items to understand today.' : 'The most important portfolio items right now.' }}
      </p>
    </div>

    <ol class="divide-y divide-subtle">
      <li
        v-for="(item, index) in visibleItems"
        :key="item.title"
        :class="[
          'py-2.5 first:pt-0 last:pb-0',
          mode === 'overview' && index > 0 ? 'hidden md:block' : ''
        ]"
      >
        <div class="flex items-start gap-3">
          <span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold tabular-nums text-faint">
            {{ mode === 'remaining' ? index + 2 : index + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <UBadge
              :label="item.badge"
              :color="item.badge === 'All clear' ? 'neutral' : badgeColor(item.kind)"
              variant="subtle"
              size="sm"
            />
            <h3 class="mt-1 text-sm font-medium leading-snug text-bright">
              {{ item.title }}
            </h3>
            <p class="mt-1 text-xs leading-relaxed text-soft">
              {{ item.description }}
            </p>
            <UButton
              v-if="item.action"
              :label="item.action"
              trailing-icon="i-lucide-arrow-down"
              color="primary"
              variant="link"
              size="xs"
              class="mt-0.5 min-h-8 px-0"
              @click="emit('navigate', item.target, item.ticker)"
            />
          </div>
        </div>
      </li>
    </ol>
  </UCard>
</template>
