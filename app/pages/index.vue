<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { TabsItem } from '@nuxt/ui'
import { api } from '~~/convex/_generated/api'
import { useConvexQuery } from 'convex-vue'

const dashboardQuery = useConvexQuery(api.dashboard.dashboard, {})
const convexClient = useConvexClient()
const initialDashboard = await dashboardQuery.suspense()
const data = computed(() => (dashboardQuery.data.value ?? initialDashboard) as any)
const dashboardFormat = useDashboardFormat()
const { number: fmtNumber, money, signedMoney, percent: fmtPercent, dateTime: fmtDateTime } = dashboardFormat

watch(data, (dashboard) => {
  dashboardFormat.configure({
    userTimezone: dashboard?.profile?.user_timezone,
    portfolioCurrency: dashboard?.profile?.portfolio_currency
  })
}, { immediate: true })

const fmtShort = (n: number | null | undefined) =>
  fmtNumber(n, { maximumFractionDigits: 0 })

const capitalAccount = computed(() => {
  if (!data.value?.status) return null
  const status = data.value.status
  return {
    initial: status.initial_cash ?? data.value?.profile?.initial_capital ?? 0,
    cash: status.cash ?? 0,
    mktVal: status.market_value ?? 0,
    realized: status.realized_pnl ?? 0,
    nav: status.nav ?? 0,
    totalReturn: status.return ?? 0,
    totalReturnPct: status.return_pct ?? 0
  }
})

const navHistory = computed(() => (data.value?.nav_history ?? []).slice(-90))
const marketEntries = computed(() => Object.entries((data.value?.markets ?? {}) as Record<string, any>))

const lastUpdated = computed(() => {
  if (data.value?.valuation?.valued_at) return data.value.valuation.valued_at
  if (data.value?.sync_metadata?.synced_at) return data.value.sync_metadata.synced_at
  const firstRun = data.value?.runs?.[0]
  return firstRun?.completed_at || firstRun?.created_at || null
})

const livePrices = ref<Record<string, null>>({})
const livePricesLoading = ref(false)

const enrichedHoldings = computed(() => {
  const holdings = data.value?.status?.holdings ?? []
  return holdings.map((holding: any) => {
    const currentPrice = holding.market_price ?? null
    return {
      ...holding,
      current_price: currentPrice,
      current_value: holding.market_value ?? null,
      current_pnl: holding.unrealized_pnl ?? null,
      isLive: data.value?.status?.valuation_status === 'FRESH'
        && !data.value?.status?.stale_tickers?.includes(holding.ticker)
    }
  })
})

const liveQuoteCount = computed(() => enrichedHoldings.value.filter((holding: any) => holding.isLive).length)
const openPositionPnl = computed(() =>
  enrichedHoldings.value.reduce((total: number, holding: any) => total + (holding.current_pnl ?? 0), 0)
)

const intelSummary = computed(() => {
  const stats = data.value?.intel_articles_stats
  if (!stats) return ''
  return `${stats.total} indexed articles · ${stats.tickers} ticker mentions`
})

type BottomTab = 'decisions' | 'research' | 'lessons' | 'data-status'
const bottomTab = ref<BottomTab>('decisions')
const tabs: TabsItem[] = [
  { value: 'decisions', label: 'Recent decisions', icon: 'i-lucide-list-checks' },
  { value: 'research', label: 'Research', icon: 'i-lucide-library' },
  { value: 'lessons', label: 'Lessons', icon: 'i-lucide-graduation-cap' },
  { value: 'data-status', label: 'Data status', icon: 'i-lucide-database' }
]

const positionToOpen = ref<string | null>(null)

const scrollToSection = async (id: string) => {
  await nextTick()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleBriefNavigation = async (
  target: 'positions' | 'exposure' | 'data-status',
  ticker?: string
) => {
  if (target === 'positions') {
    positionToOpen.value = null
    await nextTick()
    positionToOpen.value = ticker ?? null
    await scrollToSection('investments')
    return
  }
  if (target === 'exposure') {
    await scrollToSection('allocation')
    return
  }
  bottomTab.value = 'data-status'
  await scrollToSection('review')
}

const signedCurrency = (value: number | null | undefined) => signedMoney(value)
const signedPercent = (value: number | null | undefined) => fmtPercent(value, true)

const holdingCount = computed(() => data.value?.status?.holdings_count ?? 0)
const investedValue = computed(() => capitalAccount.value?.mktVal ?? 0)
const cashValue = computed(() => capitalAccount.value?.cash ?? 0)
const investedPct = computed(() => {
  const nav = capitalAccount.value?.nav ?? 0
  return nav > 0 ? Math.round((investedValue.value / nav) * 100) : 0
})

const moneySummary = computed(() => {
  if (!holdingCount.value) {
    return `${money(cashValue.value)} remains in cash. Nothing is exposed to investment price moves.`
  }

  const cashPct = Math.max(0, 100 - investedPct.value)
  return `${money(investedValue.value)} is invested across ${holdingCount.value} ${holdingCount.value === 1 ? 'investment' : 'investments'}, while ${money(cashValue.value)} (${cashPct}%) remains in cash.`
})

const quoteLabel = computed(() => {
  if (livePricesLoading.value) return 'Refreshing prices'
  if (!holdingCount.value) return 'No open investments'
  if (liveQuoteCount.value === holdingCount.value) return 'All prices are current'
  if (liveQuoteCount.value > 0) return `${liveQuoteCount.value} of ${holdingCount.value} prices are current`
  return data.value?.status?.valuation_status === 'FRESH' ? 'All saved prices are current' : 'Some prices need updating'
})

const quoteColor = computed(() => {
  if (livePricesLoading.value) return 'warning'
  if (!holdingCount.value) return 'neutral'
  if (liveQuoteCount.value === holdingCount.value) return 'success'
  return liveQuoteCount.value > 0 ? 'info' : 'warning'
})

const marketSessionStatus = computed(() =>
  String(data.value?.market_adapter?.market_session?.status ?? 'UNKNOWN').toUpperCase()
)
const isMarketLive = computed(() => marketSessionStatus.value === 'OPEN')
const marketStatusLabel = computed(() => {
  if (marketSessionStatus.value === 'OPEN') return 'Market open'
  if (marketSessionStatus.value === 'CLOSED') return 'Market closed'
  if (marketSessionStatus.value === 'HOLIDAY') return 'Market holiday'
  return 'Market status unavailable'
})

type IndexQuote = {
  name: string
  price: number
  change: number
  changePercent: number
}

const indexQuotes = ref<IndexQuote[]>([])
const indexQuotesLoading = ref(false)
const indexQuotesError = ref<string | null>(null)

const fetchIndexQuotes = async () => {
  const ticker = data.value?.portfolio_config?.benchmark_ticker
  if (!ticker) {
    indexQuotes.value = []
    indexQuotesError.value = null
    return
  }
  indexQuotesLoading.value = true
  indexQuotesError.value = null
  try {
    const quotes = await convexClient.action(api.getPrices.getLivePrices, {
      tickers: [ticker]
    })
    const quote = quotes[ticker]
    indexQuotes.value = quote
      ? [{ name: data.value?.portfolio_config?.benchmark_name ?? ticker, price: quote.price, change: quote.change, changePercent: quote.changePercent }]
      : []
    if (!indexQuotes.value.length) throw new Error('No benchmark quote was returned')
  } catch {
    indexQuotesError.value = 'The configured benchmark could not be refreshed right now.'
  } finally {
    indexQuotesLoading.value = false
  }
}

onMounted(fetchIndexQuotes)
</script>

<template>
  <div class="min-h-screen bg-canvas text-default">
    <DashboardSidebar />
    <DashboardTopBar
      :last-updated="lastUpdated"
      :preferred-name="data?.profile?.preferred_name"
    />

    <main class="min-h-screen lg:ml-64">
      <div class="px-4 py-7 md:px-6 md:py-10 lg:px-10">
        <div class="mx-auto max-w-6xl space-y-8">
          <!-- Page header -->
          <div
            id="portfolio-overview"
            class="scroll-mt-20"
          >
            <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Virtual portfolio
                </p>
                <h1 class="font-display mt-2 max-w-2xl text-3xl font-bold tracking-[-0.035em] text-bright md:text-4xl">
                  Here’s where the portfolio stands.
                </h1>
                <p class="mt-2 max-w-2xl text-sm leading-relaxed text-soft md:text-base">
                  A research and learning portfolio. No real orders are placed.
                </p>
              </div>

              <div
                class="flex flex-wrap gap-2 md:max-w-sm md:justify-end"
                aria-label="Portfolio data freshness"
              >
                <UBadge
                  :label="lastUpdated ? `Updated ${fmtDateTime(lastUpdated)}` : 'Update unavailable'"
                  :color="data?.status?.valuation_status === 'FRESH' ? 'success' : 'warning'"
                  :icon="data?.status?.valuation_status === 'FRESH' ? 'i-lucide-circle-check' : 'i-lucide-clock-alert'"
                  variant="soft"
                  size="md"
                />
                <UBadge
                  :label="quoteLabel"
                  :color="quoteColor"
                  :icon="livePricesLoading ? 'i-lucide-refresh-cw' : liveQuoteCount > 0 ? 'i-lucide-radio' : 'i-lucide-database'"
                  variant="soft"
                  size="md"
                  :class="livePricesLoading ? 'motion-safe:animate-pulse' : ''"
                />
                <UBadge
                  :label="marketStatusLabel"
                  :color="isMarketLive ? 'success' : marketSessionStatus === 'UNKNOWN' ? 'warning' : 'neutral'"
                  :icon="isMarketLive ? 'i-lucide-clock-3' : 'i-lucide-moon'"
                  variant="soft"
                  size="md"
                />
              </div>
            </div>

            <section
              aria-labelledby="money-summary-title"
              class="money-summary glow-violet mt-7 rounded-[10px] px-5 py-6 shadow-sm md:px-8 md:py-8"
            >
              <div class="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
                <div>
                  <div class="flex items-center gap-2 text-sm font-medium text-white/70">
                    <UIcon
                      name="i-lucide-wallet"
                      class="size-4"
                    />
                    <span>Your money right now</span>
                  </div>
                  <h2
                    id="money-summary-title"
                    class="font-display mt-4 text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl"
                  >
                    {{ money(data?.status?.nav) }}
                  </h2>
                  <p class="mt-3 max-w-xl text-sm leading-relaxed text-white/75 md:text-base">
                    {{ moneySummary }}
                  </p>
                </div>

                <dl class="grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-5 lg:border-t-0 lg:pt-0">
                  <div class="pr-3">
                    <dt class="text-[11px] font-medium leading-tight text-white/60">
                      Since you started
                    </dt>
                    <dd
                      class="mt-2 text-base font-bold tabular-nums md:text-lg"
                      :class="capitalAccount?.totalReturn != null && capitalAccount.totalReturn < 0 ? 'text-[#ffb4a8]' : 'text-[#bce8c9]'"
                    >
                      {{ signedCurrency(capitalAccount?.totalReturn) }}
                    </dd>
                    <p class="mt-1 text-xs tabular-nums text-white/60">
                      {{ signedPercent(capitalAccount?.totalReturnPct) }}
                    </p>
                  </div>
                  <div class="px-3">
                    <dt class="text-[11px] font-medium leading-tight text-white/60">
                      Invested now
                    </dt>
                    <dd class="mt-2 text-base font-bold tabular-nums text-white md:text-lg">
                      {{ investedPct }}%
                    </dd>
                    <p class="mt-1 text-xs text-white/60">
                      {{ holdingCount }} {{ holdingCount === 1 ? 'company' : 'companies' }}
                    </p>
                  </div>
                  <div class="pl-3">
                    <dt class="text-[11px] font-medium leading-tight text-white/60">
                      Still in cash
                    </dt>
                    <dd class="mt-2 text-base font-bold tabular-nums text-white md:text-lg">
                      {{ money(cashValue) }}
                    </dd>
                    <p class="mt-1 text-xs text-white/60">
                      Held by the strategy
                    </p>
                  </div>
                </dl>
              </div>
            </section>
          </div>

          <div class="flex items-end justify-between gap-4 border-b border-subtle pb-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                The short version
              </p>
              <h2 class="font-display mt-1 text-xl font-bold tracking-tight text-bright md:text-2xl">
                What is worth knowing today
              </h2>
            </div>
            <p class="hidden max-w-sm text-right text-sm leading-relaxed text-soft md:block">
              Harper puts the most useful context first, then keeps the specialist detail out of the way.
            </p>
          </div>

          <!-- Trend + Brief -->
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="lg:col-span-2">
              <DashboardPerformanceChart
                :nav-history="navHistory"
                :initial-capital="capitalAccount?.initial ?? data?.profile?.initial_capital ?? 0"
              />
            </div>

            <div class="space-y-6">
              <DashboardNeedsAttention
                :enriched-holdings="enrichedHoldings"
                :theses-active="data?.theses_active ?? []"
                :status="data?.status"
                @navigate="handleBriefNavigation"
              />

              <DashboardExposurePanel
                :status="data?.status"
                :capital-account="capitalAccount"
                :open-position-pnl="openPositionPnl"
              />

              <DashboardNeedsAttention
                :enriched-holdings="enrichedHoldings"
                :theses-active="data?.theses_active ?? []"
                :status="data?.status"
                mode="remaining"
                @navigate="handleBriefNavigation"
              />
            </div>
          </div>

          <div class="border-b border-subtle pb-4">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Look closer
            </p>
            <h2 class="font-display mt-1 text-xl font-bold tracking-tight text-bright md:text-2xl">
              Your investments, one clear story at a time
            </h2>
            <p class="mt-1 text-sm text-soft">
              See what you paid, what each investment is worth now, and why Harper is still holding it.
            </p>
          </div>

          <!-- Investments -->
          <DashboardPositionMonitor
            :enriched-holdings="enrichedHoldings"
            :live-prices="livePrices"
            :live-prices-loading="livePricesLoading"
            :theses-active="data?.theses_active ?? []"
            :trades="data?.trades ?? []"
            :journal="data?.journal ?? []"
            :research="data?.research ?? []"
            :open-ticker="positionToOpen"
          />

          <DashboardMarketSnapshot
            :quotes="indexQuotes"
            :loading="indexQuotesLoading"
            :error="indexQuotesError"
          />

          <DashboardOpportunityPanel
            :opportunity="data?.opportunity"
            :benchmark-name="data?.portfolio_config?.benchmark_name"
          />

          <DashboardHowHarperWorks
            :schedule="data?.operating_schedule"
            :market-adapter="data?.market_adapter"
          />

          <!-- Market context -->
          <section
            v-if="marketEntries.length"
            aria-labelledby="market-context-title"
          >
            <UCard :ui="{ root: 'rounded-[10px] border-subtle bg-surface ring-0', body: 'p-0' }">
              <UCollapsible>
                <template #default="{ open }">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    block
                    :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    class="min-h-14 justify-between px-5"
                  >
                    <span class="text-left">
                      <span
                        id="market-context-title"
                        class="block text-sm font-semibold text-bright"
                      >What the wider market is doing</span>
                      <span class="mt-0.5 block text-xs font-normal text-soft">Optional context. It does not change your portfolio numbers.</span>
                    </span>
                  </UButton>
                </template>
                <template #content>
                  <dl class="grid gap-4 border-t border-subtle px-5 py-4 sm:grid-cols-2">
                    <div
                      v-for="[name, market] in marketEntries"
                      :key="name"
                    >
                      <dt class="text-xs font-medium text-faint">
                        {{ name }}
                      </dt>
                      <dd class="mt-1 text-lg font-semibold tabular-nums text-bright">
                        {{ fmtShort(market.latest) }}
                      </dd>
                      <p class="mt-1 text-xs leading-relaxed text-soft">
                        {{ market.pct }}% through the observed range of {{ fmtShort(market.low5) }}–{{ fmtShort(market.high5) }}.
                      </p>
                    </div>
                  </dl>
                </template>
              </UCollapsible>
            </UCard>
          </section>

          <div class="border-b border-subtle pb-4">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              The record
            </p>
            <h2 class="font-display mt-1 text-xl font-bold tracking-tight text-bright md:text-2xl">
              Decisions, research, and lessons
            </h2>
          </div>

          <!-- Bottom tabs -->
          <section
            id="review"
            aria-label="Recent decisions, research, lessons, and data status"
            class="scroll-mt-16 rounded-[10px] border border-subtle bg-surface shadow-[0_16px_40px_-32px_rgba(33,48,40,0.45)]"
          >
            <UTabs
              v-model="bottomTab"
              :items="tabs"
              :content="false"
              color="neutral"
              variant="pill"
              size="sm"
              class="w-full"
              :ui="{
                root: 'gap-0',
                list: 'grid w-full grid-cols-2 gap-0 rounded-none border-b border-subtle bg-raised p-1 sm:grid-cols-4',
                indicator: 'hidden',
                trigger: 'min-h-11 px-2 text-xs text-soft data-[state=active]:ring-2 data-[state=active]:ring-inset data-[state=active]:ring-primary data-[state=active]:text-bright sm:text-sm',
                label: 'whitespace-normal text-center leading-tight'
              }"
            />

            <div class="p-4 md:p-6">
              <DashboardActivityTimeline
                v-if="bottomTab === 'decisions'"
                :trades="data?.trades ?? []"
                :journal="data?.journal ?? []"
                :decisions="data?.decisions ?? []"
              />
              <DashboardResearchPanel
                v-else-if="bottomTab === 'research'"
                :research="data?.research ?? []"
                :feed="data?.feed ?? []"
                :enriched-holdings="enrichedHoldings"
                :intel-summary="intelSummary"
              />
              <DashboardLearningPanel
                v-else-if="bottomTab === 'lessons'"
                :learning="data?.learning"
                :sources="data?.sources ?? []"
                :theses-closed="data?.theses_closed ?? []"
              />
              <DashboardSystemPanel
                v-else
                :runs="data?.runs ?? []"
                :intel-source-stats="data?.intel_source_stats ?? []"
                :intel-articles-stats="data?.intel_articles_stats"
                :data-lifecycle="data?.data_lifecycle"
                :live-quote-count="liveQuoteCount"
                :holding-count="enrichedHoldings.length"
              />
            </div>
          </section>

          <!-- AI usage & cost -->
          <section
            id="usage"
            aria-label="AI usage and cost"
            class="scroll-mt-16 rounded-[10px] border border-subtle bg-surface shadow-[0_16px_40px_-32px_rgba(33,48,40,0.45)]"
          >
            <div class="p-4 md:p-6">
              <DashboardUsagePanel :usage="data?.llm_usage ?? []" />
            </div>
          </section>

          <DashboardSettingsPanel
            :profile="data?.profile"
            :portfolio-config="data?.portfolio_config"
            :market-adapter="data?.market_adapter"
          />
        </div>
      </div>
    </main>
  </div>
</template>
