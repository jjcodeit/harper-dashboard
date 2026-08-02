<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  navHistory: { t: string, v: number }[]
  initialCapital: number
}>()

const { number, money, signedMoney, percent } = useDashboardFormat()
const fmt = (n: number | null | undefined, d = 2) =>
  number(n, { minimumFractionDigits: d, maximumFractionDigits: d })

type Period = '30D' | '90D' | 'ALL'
const period = ref<Period>('ALL')
const canvas = ref<HTMLCanvasElement | null>(null)

const periodOptions: { value: Period, label: string }[] = [
  { value: '30D', label: '30 days' },
  { value: '90D', label: '90 days' },
  { value: 'ALL', label: 'All time' }
]

const filteredHistory = computed(() => {
  if (!props.navHistory.length) return []
  const now = Date.now()
  const duration = period.value === '30D'
    ? 30 * 24 * 60 * 60 * 1000
    : period.value === '90D'
      ? 90 * 24 * 60 * 60 * 1000
      : Infinity
  const cutoff = now - duration
  return props.navHistory.filter(point => period.value === 'ALL' || new Date(point.t).getTime() > cutoff)
})

const hasTrend = computed(() => filteredHistory.value.length >= 2)
const periodStart = computed(() => filteredHistory.value[0]?.v ?? null)
const periodEnd = computed(() => filteredHistory.value.at(-1)?.v ?? null)
const periodReturn = computed(() =>
  periodStart.value != null && periodEnd.value != null ? periodEnd.value - periodStart.value : null
)
const periodReturnPct = computed(() =>
  periodStart.value != null && periodStart.value > 0 && periodReturn.value != null
    ? (periodReturn.value / periodStart.value) * 100
    : null
)
const periodHigh = computed(() => hasTrend.value ? Math.max(...filteredHistory.value.map(point => point.v)) : null)
const periodLow = computed(() => hasTrend.value ? Math.min(...filteredHistory.value.map(point => point.v)) : null)

const maxDrawdown = computed(() => {
  if (!hasTrend.value) return null
  let peak = filteredHistory.value[0]?.v ?? 0
  let lowestDrawdown = 0
  for (const point of filteredHistory.value) {
    peak = Math.max(peak, point.v)
    if (peak > 0) lowestDrawdown = Math.min(lowestDrawdown, ((point.v - peak) / peak) * 100)
  }
  return lowestDrawdown
})

const signedCurrency = (value: number | null) => signedMoney(value)
const signedPercent = (value: number | null) => percent(value, true)

const deltaColor = (value: number | null) => {
  if (value == null || Math.abs(value) < 0.005) return 'text-bright'
  return value > 0 ? 'text-success' : 'text-error'
}

const periodLabel = computed(() =>
  periodOptions.find(option => option.value === period.value)?.label.toLowerCase() ?? 'selected period'
)

const chartSummary = computed(() => {
  if (!filteredHistory.value.length) {
    return 'Harper has not recorded a portfolio history point yet.'
  }
  if (!hasTrend.value) {
    return `The latest recorded portfolio value is ${money(periodEnd.value)}. A second update is needed before a trend can be shown.`
  }
  const direction = (periodReturn.value ?? 0) > 0 ? 'rose' : (periodReturn.value ?? 0) < 0 ? 'fell' : 'was unchanged'
  if (direction === 'was unchanged') {
    return `Portfolio value was unchanged over ${periodLabel.value}, ending at ${money(periodEnd.value)}.`
  }
  return `Portfolio value ${direction} ${money(Math.abs(periodReturn.value ?? 0))} (${percent(Math.abs(periodReturnPct.value ?? 0))}) over ${periodLabel.value}, ending at ${money(periodEnd.value)}.`
})

let chartInstance: any = null

const renderChart = () => {
  if (!chartInstance) return
  chartInstance.data.labels = filteredHistory.value.map(point => point.t)
  chartInstance.data.datasets[0].data = filteredHistory.value.map(point => point.v)
  chartInstance.data.datasets[1].data = filteredHistory.value.map(() => props.initialCapital)
  const change = periodReturn.value ?? 0
  chartInstance.data.datasets[0].borderColor = change < 0 ? '#dc2626' : change > 0 ? '#0f766e' : '#89958e'
  chartInstance.data.datasets[0].backgroundColor = change < 0 ? 'rgba(220, 38, 38, 0.08)' : change > 0 ? 'rgba(15, 118, 110, 0.1)' : 'rgba(137, 149, 142, 0.08)'
  chartInstance.update()
}

onMounted(() => {
  if (!canvas.value) return
  import('chart.js').then(({ Chart, registerables }) => {
    if (!canvas.value) return
    Chart.register(...registerables)
    chartInstance = new Chart(canvas.value, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Portfolio value',
          data: [],
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          order: 2
        }, {
          label: 'Starting value',
          data: [],
          borderColor: '#9ca3af',
          borderDash: [6, 3],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          order: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'start',
            labels: { color: '#65736b', boxWidth: 12, padding: 12, font: { size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#65736b', maxTicksLimit: 5, maxRotation: 0, autoSkip: true }
          },
          y: {
            grid: { color: '#e7ede8' },
            ticks: { color: '#65736b', callback: (value: any) => money(Number(value), undefined, { notation: 'compact' }) }
          }
        }
      }
    })
    renderChart()
  })
})

onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
})

watch(filteredHistory, renderChart)
</script>

<template>
  <UCard
    id="performance"
    aria-labelledby="performance-title"
    :ui="{ root: 'h-full scroll-mt-16 overflow-visible rounded-[10px] border-subtle bg-surface ring-0', body: 'p-5 md:p-6' }"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2
          id="performance-title"
          class="text-base font-semibold text-bright"
        >
          How your portfolio is going
        </h2>
        <p class="mt-1 text-xs leading-relaxed text-soft">
          Your total value over time, including cash and investments.
        </p>
      </div>

      <div class="flex flex-wrap gap-1">
        <UButton
          v-for="option in periodOptions"
          :key="option.value"
          :label="option.label"
          color="neutral"
          size="sm"
          :variant="period === option.value ? 'soft' : 'ghost'"
          class="min-h-9"
          @click="period = option.value"
        />
      </div>
    </div>

    <div class="mt-4 border-l-2 border-primary pl-3">
      <div class="text-xs font-semibold text-primary">
        In plain English
      </div>
      <p
        class="mt-1 text-sm leading-relaxed text-default"
        aria-live="polite"
      >
        {{ chartSummary }}
      </p>
    </div>

    <div
      v-if="hasTrend"
      class="mt-4 h-52 w-full md:h-60"
    >
      <canvas
        ref="canvas"
        role="img"
        :aria-label="chartSummary"
        class="h-full w-full"
      />
    </div>

    <div
      v-else
      class="mt-5 rounded-lg bg-raised px-4 py-6 text-center"
    >
      <UIcon
        name="i-lucide-chart-no-axes-column-increasing"
        class="mx-auto size-5 text-faint"
      />
      <p class="mt-2 text-sm text-soft">
        A performance trend will appear after Harper records another portfolio update.
      </p>
    </div>

    <div class="mt-5 flex items-end justify-between gap-4 border-t border-subtle pt-4">
      <div>
        <div class="text-xs text-soft">
          Total change
        </div>
        <div
          class="mt-1 text-lg font-semibold tabular-nums"
          :class="deltaColor(periodReturn)"
        >
          {{ signedCurrency(periodReturn) }}
          <span class="text-sm font-medium">({{ signedPercent(periodReturnPct) }})</span>
        </div>
      </div>
      <div class="text-right text-xs text-soft">
        {{ filteredHistory.length }} {{ filteredHistory.length === 1 ? 'update' : 'updates' }}
      </div>
    </div>

    <UCollapsible
      v-if="hasTrend"
      class="mt-3"
    >
      <template #default="{ open }">
        <UButton
          color="neutral"
          variant="ghost"
          block
          :label="open ? 'Hide advanced performance details' : 'Advanced performance details'"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="min-h-11 justify-between px-0 text-sm"
        />
      </template>
      <template #content>
        <dl class="grid gap-4 pb-1 pt-3 sm:grid-cols-3">
          <div>
            <dt class="text-xs text-soft">
              Start → end
            </dt>
            <dd class="mt-1 text-sm font-medium tabular-nums text-bright">
              {{ money(periodStart) }} → {{ money(periodEnd) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-soft">
              High / low
            </dt>
            <dd class="mt-1 text-sm font-medium tabular-nums text-bright">
              {{ money(periodHigh) }} / {{ money(periodLow) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-soft">
              Largest drop <span class="font-normal">(max drawdown)</span>
            </dt>
            <dd class="mt-1 text-sm font-medium tabular-nums text-bright">
              {{ maxDrawdown == null ? '—' : `${fmt(Math.abs(maxDrawdown), 1)}%` }}
            </dd>
            <p class="mt-1 text-xs leading-relaxed text-soft">
              Biggest fall from a previous portfolio high in this period.
            </p>
          </div>
        </dl>
      </template>
    </UCollapsible>
  </UCard>
</template>
