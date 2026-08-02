<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  enrichedHoldings: any[]
  livePrices: Record<string, any>
  livePricesLoading: boolean
  thesesActive: any[]
  trades: any[]
  journal: any[]
  research: any[]
  openTicker?: string | null
}>()

const { number, money, signedMoney, percent } = useDashboardFormat()
const fmt = (n: number | null | undefined, d = 2) =>
  number(n, { minimumFractionDigits: d, maximumFractionDigits: d })

const stripSuffix = (ticker: string) => ticker.replace(/\.(NS|BO)$/, '')

const signedCurrency = (value: number | null | undefined) => signedMoney(value)
const signedPercent = (value: number | null | undefined) => percent(value, true)

const deltaColor = (value: number | null | undefined) => {
  if (value == null || Math.abs(value) < 0.005) return 'text-bright'
  return value > 0 ? 'text-success' : 'text-error'
}

const positionReturnPct = (holding: any) => {
  const shares = holding.signed_shares ?? holding.shares
  const cost = Math.abs(shares * holding.avg_cost_basis)
  return cost > 0 ? ((holding.current_pnl ?? 0) / cost) * 100 : null
}

type SortKey = 'attention' | 'pnl' | 'exposure' | 'ticker'
const sortKey = ref<SortKey>('attention')
const sortDir = ref<'asc' | 'desc'>('desc')
const expandedTicker = ref<string | null>(null)
const filterText = ref('')

const getThesis = (ticker: string) => props.thesesActive?.find((thesis: any) => thesis.ticker === ticker) ?? null
const getTrades = (ticker: string) => props.trades?.filter((trade: any) => trade.ticker === ticker) ?? []
const getJournal = (ticker: string) => {
  const symbol = stripSuffix(ticker).toLowerCase()
  return props.journal?.filter((entry: any) => entry.content?.toLowerCase().includes(symbol)) ?? []
}
const getResearch = (ticker: string) => props.research?.filter((entry: any) => entry.ticker === ticker) ?? []

const targetDistancePct = (holding: any) => {
  const target = getThesis(holding.ticker)?.target
  return target && holding.current_price != null ? Math.abs((holding.current_price - target) / target) * 100 : null
}

const attentionScore = (holding: any) => {
  let score = 0
  if (holding.current_pnl < -50) score += 4
  else if (holding.current_pnl < 0) score += 2
  if (!holding.isLive) score += 2
  const thesis = getThesis(holding.ticker)
  if (thesis && (thesis.confidence ?? 100) < 30) score += 3
  if (targetDistancePct(holding) != null && (targetDistancePct(holding) ?? 100) < 5) score += 1
  return score
}

const needsReview = (holding: any) => attentionScore(holding) >= 3

const totalGrossValue = computed(() =>
  props.enrichedHoldings.reduce((total: number, holding: any) => total + Math.abs(holding.current_value ?? 0), 0)
)

const positionWeight = (holding: any) =>
  totalGrossValue.value > 0 ? (Math.abs(holding.current_value ?? 0) / totalGrossValue.value) * 100 : 0

const setSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    return
  }
  sortKey.value = key
  sortDir.value = key === 'ticker' ? 'asc' : 'desc'
}

const sortedHoldings = computed(() => {
  const query = filterText.value.trim().toLowerCase()
  const list = props.enrichedHoldings.filter((holding: any) =>
    !query || stripSuffix(holding.ticker).toLowerCase().includes(query)
  )

  return [...list].sort((a: any, b: any) => {
    if (sortKey.value === 'ticker') {
      const result = stripSuffix(a.ticker).localeCompare(stripSuffix(b.ticker))
      return sortDir.value === 'asc' ? result : -result
    }

    const value = (holding: any) => {
      if (sortKey.value === 'attention') return attentionScore(holding)
      if (sortKey.value === 'pnl') return holding.current_pnl ?? 0
      return Math.abs(holding.current_value ?? 0)
    }
    return sortDir.value === 'desc' ? value(b) - value(a) : value(a) - value(b)
  })
})

const toggleExpand = (ticker: string) => {
  expandedTicker.value = expandedTicker.value === ticker ? null : ticker
}

watch(() => props.openTicker, (ticker) => {
  if (ticker) expandedTicker.value = ticker
}, { immediate: true })
</script>

<template>
  <UCard
    id="investments"
    aria-labelledby="investments-title"
    :ui="{ root: 'mb-6 scroll-mt-16 overflow-visible rounded-[10px] border-subtle bg-surface ring-0', body: 'p-0' }"
  >
    <div class="border-b border-subtle p-4 md:p-5">
      <div class="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2
            id="investments-title"
            class="text-base font-semibold text-bright"
          >
            Your investments
            <span class="ml-1 text-sm font-normal text-soft">{{ enrichedHoldings.length }} open</span>
          </h2>
          <p class="mt-1 text-xs leading-relaxed text-soft">
            Compare what you paid, today’s price, and Harper’s target. Open a row to see the reason for holding it.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <UInput
            v-model="filterText"
            icon="i-lucide-search"
            size="sm"
            placeholder="Find an investment"
            aria-label="Find an investment by company code"
            class="w-full sm:w-48"
          />
          <div
            class="flex flex-wrap gap-1"
            aria-label="Sort investments"
          >
            <UButton
              v-for="option in ([{ key: 'attention', label: 'Needs review' }, { key: 'pnl', label: 'Gain/loss' }, { key: 'exposure', label: 'Amount' }, { key: 'ticker', label: 'A–Z' }] as const)"
              :key="option.key"
              :label="option.label"
              color="neutral"
              size="sm"
              :variant="sortKey === option.key ? 'soft' : 'ghost'"
              class="min-h-9"
              @click="setSort(option.key)"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!enrichedHoldings.length"
      class="px-4 py-6 text-center text-sm text-soft"
    >
      No open positions. The portfolio is currently held in cash.
    </div>

    <div
      v-else-if="!sortedHoldings.length"
      class="px-4 py-6 text-center text-sm text-soft"
    >
      No open investment matches "{{ filterText }}".
    </div>

    <div
      v-else
      class="min-w-0"
    >
      <div class="hidden overflow-x-auto md:block">
        <table class="w-full min-w-4xl table-fixed text-sm">
          <caption class="sr-only">
            Open investments with price path, open return, portfolio size, Harper confidence, and review state
          </caption>
          <thead class="bg-elevated text-xs text-soft">
            <tr>
              <th
                rowspan="2"
                scope="col"
                class="w-36 px-3 py-3 text-left font-medium align-bottom"
              >
                Investment
              </th>
              <th
                colspan="3"
                scope="colgroup"
                class="border-b border-subtle px-3 py-2 text-center font-medium"
              >
                Price path
              </th>
              <th
                rowspan="2"
                scope="col"
                class="w-28 px-3 py-3 text-right font-medium align-bottom"
              >
                Gain or loss
              </th>
              <th
                rowspan="2"
                scope="col"
                class="w-20 px-3 py-3 text-right font-medium align-bottom"
              >
                Size
              </th>
              <th
                rowspan="2"
                scope="col"
                class="w-24 px-3 py-3 text-center font-medium align-bottom"
              >
                Harper confidence
              </th>
              <th
                rowspan="2"
                scope="col"
                class="w-24 px-3 py-3 text-center font-medium align-bottom"
              >
                Review
              </th>
            </tr>
            <tr>
              <th
                scope="col"
                class="px-3 py-2 text-right font-normal"
              >
                Avg. paid
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-right font-normal"
              >
                Last available price
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-right font-normal"
              >
                Target
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-subtle">
            <template
              v-for="holding in sortedHoldings"
              :key="holding.ticker"
            >
              <tr class="hover:bg-elevated/50">
                <th
                  scope="row"
                  class="px-3 py-3 text-left font-normal text-bright"
                >
                  <UButton
                    :label="stripSuffix(holding.ticker)"
                    :leading-icon="expandedTicker === holding.ticker ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                    color="neutral"
                    variant="link"
                    class="min-h-10 px-0 text-sm font-semibold"
                    :aria-expanded="expandedTicker === holding.ticker"
                    :aria-controls="`investment-detail-${holding.ticker}`"
                    @click="toggleExpand(holding.ticker)"
                  />
                  <div class="flex flex-wrap items-center gap-1.5 pl-6">
                    <span class="text-xs tabular-nums text-soft">
                      {{ Math.abs(holding.shares) }} {{ Math.abs(holding.shares) === 1 ? 'share' : 'shares' }}
                    </span>
                  </div>
                </th>
                <td class="px-3 py-3 text-right font-medium tabular-nums text-bright">
                  {{ money(holding.avg_cost_basis, holding.trading_currency) }}
                </td>
                <td class="px-3 py-3 text-right">
                  <div
                    class="font-semibold tabular-nums"
                    :class="deltaColor(holding.current_pnl)"
                  >
                    {{ money(holding.current_price, holding.trading_currency) }}
                  </div>
                  <UBadge
                    :label="holding.isLive ? 'Price current' : 'Last available price'"
                    :color="holding.isLive ? 'success' : 'warning'"
                    variant="subtle"
                    size="sm"
                    class="mt-1"
                  />
                </td>
                <td class="px-3 py-3 text-right">
                  <template v-if="getThesis(holding.ticker)?.target">
                    <div class="font-medium tabular-nums text-bright">
                      {{ money(getThesis(holding.ticker).target, holding.trading_currency) }}
                    </div>
                    <div class="mt-0.5 text-xs tabular-nums text-soft">
                      {{ fmt(targetDistancePct(holding), 1) }}% away
                    </div>
                  </template>
                  <span
                    v-else
                    class="text-soft"
                  >—</span>
                </td>
                <td class="px-3 py-3 text-right">
                  <div
                    class="font-semibold tabular-nums"
                    :class="deltaColor(holding.current_pnl)"
                  >
                    {{ signedCurrency(holding.current_pnl) }}
                  </div>
                  <div
                    class="mt-0.5 text-xs tabular-nums"
                    :class="deltaColor(positionReturnPct(holding))"
                  >
                    {{ signedPercent(positionReturnPct(holding)) }}
                  </div>
                </td>
                <td class="px-3 py-3 text-right font-medium tabular-nums text-default">
                  {{ fmt(positionWeight(holding), 0) }}%
                </td>
                <td class="px-3 py-3 text-center tabular-nums text-default">
                  {{ getThesis(holding.ticker)?.confidence != null ? `${getThesis(holding.ticker).confidence}%` : '—' }}
                </td>
                <td class="px-3 py-3 text-center">
                  <UBadge
                    :label="needsReview(holding) ? 'Review' : 'No alert'"
                    :color="needsReview(holding) ? 'warning' : 'neutral'"
                    variant="subtle"
                    size="sm"
                  />
                </td>
              </tr>
              <tr v-if="expandedTicker === holding.ticker">
                <td
                  :id="`investment-detail-${holding.ticker}`"
                  colspan="8"
                  class="bg-elevated p-0"
                >
                  <DashboardPositionDetails
                    :holding="holding"
                    :thesis="getThesis(holding.ticker)"
                    :trades="getTrades(holding.ticker)"
                    :journal="getJournal(holding.ticker)"
                    :research="getResearch(holding.ticker)"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="divide-y divide-subtle md:hidden">
        <article
          v-for="holding in sortedHoldings"
          :key="holding.ticker"
        >
          <button
            type="button"
            class="min-h-11 w-full p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            :aria-expanded="expandedTicker === holding.ticker"
            :aria-controls="`mobile-investment-detail-${holding.ticker}`"
            @click="toggleExpand(holding.ticker)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="expandedTicker === holding.ticker ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                    class="size-4 text-soft"
                  />
                  <span class="text-base font-semibold text-bright">{{ stripSuffix(holding.ticker) }}</span>
                </div>
                <div class="mt-1 pl-6 text-xs text-soft">
                  {{ Math.abs(holding.shares) }} {{ Math.abs(holding.shares) === 1 ? 'share' : 'shares' }} · {{ fmt(positionWeight(holding), 0) }}% of open position size
                </div>
              </div>
              <div class="text-right">
                <div
                  class="font-semibold tabular-nums"
                  :class="deltaColor(holding.current_pnl)"
                >
                  {{ signedCurrency(holding.current_pnl) }}
                </div>
                <div class="mt-0.5 text-xs tabular-nums text-soft">
                  Gain or loss · {{ signedPercent(positionReturnPct(holding)) }}
                </div>
              </div>
            </div>

            <div class="mt-4 space-y-2 border-y border-subtle py-3 sm:grid sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-2 sm:space-y-0">
              <div class="flex items-center justify-between gap-2 sm:block">
                <span class="text-xs text-soft">Avg. paid</span>
                <span class="text-sm font-medium tabular-nums text-bright">{{ money(holding.avg_cost_basis, holding.trading_currency) }}</span>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="hidden sm:block size-3.5 text-faint"
              />
              <div class="flex items-center justify-between gap-2 sm:block sm:text-center">
                <span class="text-xs text-soft">Last available</span>
                <span
                  class="text-sm font-semibold tabular-nums"
                  :class="deltaColor(holding.current_pnl)"
                >{{ money(holding.current_price, holding.trading_currency) }}</span>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="hidden sm:block size-3.5 text-faint"
              />
              <div class="flex items-center justify-between gap-2 sm:block sm:text-right">
                <span class="text-xs text-soft">Target</span>
                <span class="text-sm font-medium tabular-nums text-bright">{{ getThesis(holding.ticker)?.target ? money(getThesis(holding.ticker).target, holding.trading_currency) : '—' }}</span>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
              <UBadge
                :label="holding.isLive ? 'Price current' : 'Last available price'"
                :color="holding.isLive ? 'success' : 'warning'"
                variant="subtle"
                size="sm"
              />
              <span class="text-xs text-soft">
                {{ getThesis(holding.ticker)?.confidence != null ? `Harper confidence ${getThesis(holding.ticker).confidence}%` : 'No investment reason linked' }}
              </span>
            </div>
          </button>

          <div
            v-if="expandedTicker === holding.ticker"
            :id="`mobile-investment-detail-${holding.ticker}`"
            class="border-t border-subtle bg-elevated"
          >
            <DashboardPositionDetails
              :holding="holding"
              :thesis="getThesis(holding.ticker)"
              :trades="getTrades(holding.ticker)"
              :journal="getJournal(holding.ticker)"
              :research="getResearch(holding.ticker)"
            />
          </div>
        </article>
      </div>
    </div>

    <p
      v-if="livePricesLoading"
      class="mt-2 flex items-center gap-2 px-5 pb-4 text-xs text-faint"
      aria-live="polite"
    >
      <UIcon
        name="i-lucide-refresh-cw"
        class="size-3.5 motion-safe:animate-spin"
      />
      Refreshing prices.
    </p>
  </UCard>
</template>
