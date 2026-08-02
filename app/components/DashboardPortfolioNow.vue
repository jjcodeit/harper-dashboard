<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from 'vue'

const props = defineProps<{
  status: any
  capitalAccount: any
  lastUpdated: string | null
  livePricesLoading: boolean
  liveQuoteCount: number
  openPositionPnl: number
}>()

const { number, money, signedMoney, percent, dateTime: fmtDateTime } = useDashboardFormat()
const fmt = (value: number | null | undefined, digits = 2) =>
  number(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })
const signedCurrency = (value: number | null | undefined) => signedMoney(value)
const signedPercent = (value: number | null | undefined) => percent(value, true)

const deltaColor = (value: number | null | undefined) => {
  if (value == null || Math.abs(value) < 0.005) return 'text-bright'
  return value > 0 ? 'text-success' : 'text-error'
}

const runTime = computed(() => {
  const latestRun = props.status?.latest_run
  return latestRun?.completed_at || latestRun?.created_at || props.lastUpdated
})

const runStatus = computed(() => props.status?.latest_run?.status ?? null)
const holdingCount = computed(() => props.status?.holdings_count ?? 0)

const quoteLabel = computed(() => {
  if (props.livePricesLoading) return 'Refreshing quotes'
  if (!holdingCount.value) return 'No open investments'
  if (props.liveQuoteCount === holdingCount.value) return 'All prices refreshed'
  if (props.liveQuoteCount > 0) return `${props.liveQuoteCount} of ${holdingCount.value} prices refreshed`
  return 'Last available prices in use'
})

const quoteColor = computed(() => {
  if (props.livePricesLoading) return 'warning'
  if (!holdingCount.value) return 'neutral'
  if (props.liveQuoteCount === holdingCount.value) return 'success'
  return props.liveQuoteCount > 0 ? 'info' : 'warning'
})

const portfolioMeaning = computed(() => {
  const total = props.capitalAccount?.totalReturn ?? 0
  const open = props.openPositionPnl ?? 0
  if (Math.abs(total) < 0.005) {
    return `The portfolio is close to its starting value. Open investments currently show ${signedCurrency(open)}.`
  }
  const direction = total > 0 ? 'above' : 'below'
  return `The portfolio is ${money(Math.abs(total))} ${direction} its starting value. Open investments currently show ${signedCurrency(open)}.`
})
</script>

<template>
  <header class="mb-6">
    <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-bright">
          Harper's Brief
        </h1>
        <p class="mt-1 text-sm text-soft">
          Portfolio performance, priorities, and the reasons behind current investments.
        </p>
      </div>

      <div
        class="flex flex-wrap gap-2"
        aria-label="Portfolio data freshness"
      >
        <UBadge
          :label="runStatus === 'COMPLETED' ? `Portfolio updated ${fmtDateTime(runTime)}` : runStatus ? `Portfolio update ${runStatus.toLowerCase()}` : 'Portfolio update unavailable'"
          :color="runStatus === 'COMPLETED' ? 'success' : runStatus ? 'warning' : 'neutral'"
          :icon="runStatus === 'COMPLETED' ? 'i-lucide-circle-check' : 'i-lucide-clock-alert'"
          variant="subtle"
          size="lg"
        />
        <UBadge
          :label="quoteLabel"
          :color="quoteColor"
          :icon="livePricesLoading ? 'i-lucide-refresh-cw' : liveQuoteCount > 0 ? 'i-lucide-radio' : 'i-lucide-database'"
          variant="subtle"
          size="lg"
          :class="livePricesLoading ? 'motion-safe:animate-pulse' : ''"
        />
      </div>
    </div>

    <div class="overflow-visible rounded-lg border border-subtle bg-muted">
      <div class="grid md:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <section
          aria-labelledby="portfolio-overview-title"
          class="p-4 md:p-5"
        >
          <h2
            id="portfolio-overview-title"
            class="text-base font-semibold text-bright"
          >
            Portfolio overview
          </h2>

          <dl class="mt-4 grid gap-5 sm:grid-cols-3 sm:divide-x sm:divide-subtle">
            <div class="sm:pr-4">
              <dt class="text-xs font-medium text-soft">
                Portfolio value
              </dt>
              <dd class="mt-1 text-2xl font-semibold tabular-nums text-bright">
                {{ money(status?.nav) }}
              </dd>
              <p class="mt-1.5 text-xs leading-relaxed text-soft">
                Cash plus the current value of all open investments.
              </p>
            </div>

            <div class="sm:px-4">
              <dt class="text-xs font-medium text-soft">
                Total gain/loss
              </dt>
              <dd
                class="mt-1 text-2xl font-semibold tabular-nums"
                :class="deltaColor(capitalAccount?.totalReturn)"
              >
                {{ signedCurrency(capitalAccount?.totalReturn) }}
              </dd>
              <div
                class="mt-0.5 text-sm font-medium tabular-nums"
                :class="deltaColor(capitalAccount?.totalReturnPct)"
              >
                {{ signedPercent(capitalAccount?.totalReturnPct) }}
              </div>
              <p class="mt-1.5 text-xs leading-relaxed text-soft">
                Change since the portfolio started.
              </p>
            </div>

            <div class="sm:pl-4">
              <dt class="text-xs font-medium text-soft">
                Gain or loss still changing
              </dt>
              <dd
                class="mt-1 text-2xl font-semibold tabular-nums"
                :class="deltaColor(openPositionPnl)"
              >
                {{ signedCurrency(openPositionPnl) }}
              </dd>
              <p class="mt-1.5 text-xs leading-relaxed text-soft">
                Profit or loss on investments that are still held.
              </p>
            </div>
          </dl>

          <dl class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-subtle bg-raised p-3">
              <dt class="text-xs font-medium text-soft">
                Exposure regime
              </dt>
              <dd class="mt-1 text-sm font-semibold text-bright">
                {{ status?.exposure_regime?.name?.replaceAll('_', ' ') || 'NORMAL' }}
              </dd>
              <p class="mt-1 text-xs text-soft">
                Target band {{ fmt(status?.exposure_regime?.min_exposure_pct, 0) }}–{{ fmt(status?.exposure_regime?.max_exposure_pct, 0) }}%; current {{ fmt(status?.exposure_regime?.current_exposure_pct, 1) }}%.
              </p>
            </div>
            <div class="rounded-lg border border-subtle bg-raised p-3">
              <dt class="text-xs font-medium text-soft">
                Why cash is held
              </dt>
              <dd class="mt-1 text-sm font-semibold text-bright">
                {{ status?.latest_cash_reason?.cash_reason?.replaceAll('_', ' ') || 'No recorded cash decision' }}
              </dd>
              <p class="mt-1 line-clamp-2 text-xs text-soft">
                {{ status?.latest_cash_reason?.rationale || 'Cash rationale will appear after the next NO_TRADE decision.' }}
              </p>
            </div>
          </dl>
          <div class="mt-5 border-l-2 border-primary pl-3">
            <div class="text-xs font-medium text-primary">
              What this means
            </div>
            <p class="mt-1 text-sm leading-relaxed text-default">
              {{ portfolioMeaning }}
            </p>
          </div>
        </section>

        <div class="border-t border-subtle p-4 md:border-l md:border-t-0 md:p-5">
          <slot name="brief" />
        </div>
      </div>
    </div>
  </header>
</template>
