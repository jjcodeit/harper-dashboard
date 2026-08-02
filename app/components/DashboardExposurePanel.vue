<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from 'vue'

const props = defineProps<{
  status: any
  capitalAccount: any
  openPositionPnl: number
}>()

const { number, money, signedMoney } = useDashboardFormat()
const fmt = (n: number | null | undefined, d = 2) =>
  number(n, { minimumFractionDigits: d, maximumFractionDigits: d })

const cashPct = computed(() =>
  props.status?.nav > 0 ? (props.status.cash / props.status.nav) * 100 : 0
)

const grossExposure = computed(() => props.status?.gross_exposure_pct ?? 0)

const hasLeverage = computed(() => grossExposure.value > 100)

const signedCurrency = (value: number | null | undefined) => signedMoney(value)

const deltaColor = (value: number | null | undefined) => {
  if (value == null || Math.abs(value) < 0.005) return 'text-default'
  return value > 0 ? 'text-success' : 'text-error'
}

const meaning = computed(() => {
  if (!props.status?.holdings_count) {
    return 'Everything is in cash right now, so market price changes cannot move the portfolio.'
  }
  if (hasLeverage.value) {
    return `${fmt(grossExposure.value, 0)}% is in the market. That is more than the portfolio value, so both gains and losses can move faster.`
  }
  return `${fmt(cashPct.value, 0)}% is in cash and ${fmt(grossExposure.value, 0)}% is currently invested.`
})
</script>

<template>
  <UCard
    id="allocation"
    aria-labelledby="allocation-title"
    :ui="{ root: 'overflow-visible rounded-[10px] border-subtle bg-surface ring-0', body: 'p-5' }"
  >
    <div class="mb-4">
      <h2
        id="allocation-title"
        class="text-base font-semibold text-bright"
      >
        Where your money is
      </h2>
      <p class="mt-1 text-xs leading-relaxed text-soft">
        A simple split between money in the market and cash still available.
      </p>
    </div>

    <dl class="grid grid-cols-2 gap-x-4 gap-y-5">
      <div>
        <dt class="text-xs text-soft">
          Cash
        </dt>
        <dd class="mt-1 text-xl font-semibold tabular-nums text-bright">
          {{ fmt(cashPct, 0) }}%
        </dd>
        <div class="mt-0.5 text-xs tabular-nums text-faint">
          {{ money(status?.cash) }} in cash
        </div>
      </div>
      <div>
        <dt class="text-xs text-soft">
          In investments
        </dt>
        <dd
          class="mt-1 text-xl font-semibold tabular-nums"
          :class="hasLeverage ? 'text-warning' : 'text-bright'"
        >
          {{ fmt(grossExposure, 0) }}%
        </dd>
        <div class="mt-0.5 text-xs text-faint">
          Share currently in the market
        </div>
      </div>
    </dl>

    <div class="mt-5 border-l-2 border-primary pl-3">
      <div class="text-xs font-semibold text-primary">
        In plain English
      </div>
      <p class="mt-1 text-sm leading-relaxed text-default">
        {{ meaning }}
      </p>
    </div>

    <UCollapsible class="mt-5 border-t border-subtle pt-1">
      <template #default="{ open }">
        <UButton
          color="neutral"
          variant="ghost"
          block
          :label="open ? 'Hide the detailed breakdown' : 'See the detailed breakdown'"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="min-h-11 justify-between px-0 text-sm"
        />
      </template>
      <template #content>
        <dl class="space-y-3 pb-1 pt-3 text-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <dt class="text-default">
                Market direction
              </dt>
              <p class="mt-0.5 text-xs text-soft">
                The share of the portfolio affected by upward market moves.
              </p>
            </div>
            <dd class="shrink-0 font-medium tabular-nums text-bright">
              {{ fmt(status?.net_exposure_pct) }}%
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4 border-t border-subtle pt-3">
            <div>
              <dt class="text-default">
                Gain or loss already taken
              </dt>
              <p class="mt-0.5 text-xs text-soft">
                Profit or loss already locked in by closing investments.
              </p>
            </div>
            <dd
              class="shrink-0 font-medium tabular-nums"
              :class="deltaColor(capitalAccount?.realized)"
            >
              {{ signedCurrency(capitalAccount?.realized) }}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4 border-t border-subtle pt-3">
            <div>
              <dt class="text-default">
                Gain or loss still changing
              </dt>
              <p class="mt-0.5 text-xs text-soft">
                Profit or loss on investments that are still held.
              </p>
            </div>
            <dd
              class="shrink-0 font-medium tabular-nums"
              :class="deltaColor(openPositionPnl)"
            >
              {{ signedCurrency(openPositionPnl) }}
            </dd>
          </div>
        </dl>
      </template>
    </UCollapsible>
  </UCard>
</template>
