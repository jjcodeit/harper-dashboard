<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TabsItem } from '@nuxt/ui'

interface UsageRow {
  session_id: string
  root_session_id: string
  job_name: string
  model: string
  provider: string
  started_at: string
  api_calls: number
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  reasoning_tokens: number
  estimated_cost_usd: number
  actual_cost_usd: number
  cost_status: string
}

type UsagePeriod = 'week' | 'month' | 'all'

const props = defineProps<{
  usage: UsageRow[]
}>()

const period = ref<UsagePeriod>('week')
const periodItems: TabsItem[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' }
]

const { number, money } = useDashboardFormat()
const fmtTokens = (value: number) => number(value)
const fmtCompact = (value: number) => number(value, { notation: 'compact', maximumFractionDigits: 1 })
const fmtUsd = (value: number) => money(value, 'USD', {
  minimumFractionDigits: value > 0 && value < 0.01 ? 4 : 2,
  maximumFractionDigits: value > 0 && value < 0.01 ? 4 : 2
})

const periodStart = computed(() => {
  if (period.value === 'all') return null

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (period.value === 'month') {
    start.setDate(1)
  } else {
    const daysSinceMonday = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - daysSinceMonday)
  }
  return start.getTime()
})

const periodRows = computed(() => (props.usage ?? []).filter((row) => {
  const startedAt = new Date(row.started_at).getTime()
  return Number.isFinite(startedAt)
    && (periodStart.value === null || startedAt >= periodStart.value)
}))

const emptyTitle = computed(() => ({
  week: 'No usage recorded this week',
  month: 'No usage recorded this month',
  all: 'No usage recorded yet'
})[period.value])

const rowTokens = (row: UsageRow) =>
  (row.input_tokens ?? 0)
  + (row.output_tokens ?? 0)
  + (row.cache_read_tokens ?? 0)
  + (row.cache_write_tokens ?? 0)

const rowCost = (row: UsageRow) =>
  row.actual_cost_usd > 0 ? row.actual_cost_usd : (row.estimated_cost_usd ?? 0)

const totals = computed(() => {
  const rows = periodRows.value
  const statuses = new Set(rows.map(row => row.cost_status || 'unknown'))
  const cost = rows.reduce((sum, row) => sum + rowCost(row), 0)
  const hasUnknownCost = statuses.has('unknown')
  const allFree = rows.length > 0 && [...statuses].every(status => status === 'free')
  const allUnknown = rows.length > 0 && [...statuses].every(status => status === 'unknown')

  return {
    sessions: new Set(rows.map(row => row.root_session_id)).size,
    apiCalls: rows.reduce((sum, row) => sum + (row.api_calls ?? 0), 0),
    inputTokens: rows.reduce((sum, row) => sum + (row.input_tokens ?? 0), 0),
    outputTokens: rows.reduce((sum, row) => sum + (row.output_tokens ?? 0), 0),
    cacheTokens: rows.reduce(
      (sum, row) => sum + (row.cache_read_tokens ?? 0) + (row.cache_write_tokens ?? 0),
      0
    ),
    reasoningTokens: rows.reduce((sum, row) => sum + (row.reasoning_tokens ?? 0), 0),
    totalTokens: rows.reduce((sum, row) => sum + rowTokens(row), 0),
    cost,
    hasUnknownCost,
    allFree,
    allUnknown
  }
})

const costValue = computed(() => {
  if (!periodRows.value.length) return '—'
  if (totals.value.allUnknown) return 'Unpriced'
  return fmtUsd(totals.value.cost)
})

const costCaption = computed(() => {
  if (!periodRows.value.length) return 'No model calls recorded'
  if (totals.value.hasUnknownCost) return 'Tracked total; some calls are unpriced'
  if (totals.value.allFree) return 'All recorded calls used free pricing'
  return 'Actual cost where reported, otherwise estimated'
})

const modelBreakdown = computed(() => {
  const grouped = new Map<string, {
    model: string
    provider: string
    tokens: number
    cost: number
    sessions: Set<string>
    statuses: Set<string>
  }>()

  for (const row of periodRows.value) {
    const key = `${row.provider}\u0000${row.model}`
    const group = grouped.get(key) ?? {
      model: row.model,
      provider: row.provider,
      tokens: 0,
      cost: 0,
      sessions: new Set<string>(),
      statuses: new Set<string>()
    }
    group.tokens += rowTokens(row)
    group.cost += rowCost(row)
    group.sessions.add(row.root_session_id)
    group.statuses.add(row.cost_status || 'unknown')
    grouped.set(key, group)
  }

  return [...grouped.values()]
    .map(group => ({
      ...group,
      sessionCount: group.sessions.size,
      costLabel: group.statuses.has('unknown') && group.cost === 0
        ? 'Unpriced'
        : group.statuses.size === 1 && group.statuses.has('free')
          ? 'Free'
          : fmtUsd(group.cost)
    }))
    .sort((a, b) => b.tokens - a.tokens)
})
</script>

<template>
  <section aria-labelledby="ai-usage-title">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-coins"
            class="size-4 text-soft"
          />
          <h3
            id="ai-usage-title"
            class="text-sm font-semibold text-bright"
          >
            Harper running costs
          </h3>
        </div>
        <p class="mt-1 text-xs leading-relaxed text-soft">
          What it costs Harper to review the portfolio, answer questions, and gather research.
        </p>
      </div>

      <UTabs
        v-model="period"
        :items="periodItems"
        :content="false"
        color="neutral"
        variant="pill"
        size="xs"
        class="w-full sm:w-auto"
        :ui="{
          list: 'grid w-full grid-cols-3 sm:w-auto',
          trigger: 'min-h-9 px-3'
        }"
      />
    </div>

    <div
      v-if="periodRows.length"
      class="mt-5"
    >
      <dl class="grid grid-cols-2 border-y border-subtle lg:grid-cols-4">
        <div class="border-b border-subtle py-4 pr-3 lg:border-b-0 lg:border-r">
          <dt class="text-xs font-medium text-soft">
            Cost
          </dt>
          <dd class="mt-1 text-xl font-semibold tabular-nums text-bright">
            {{ costValue }}
          </dd>
          <p class="mt-1 text-xs leading-relaxed text-soft">
            {{ costCaption }}
          </p>
        </div>
        <div class="border-b border-l border-subtle py-4 pl-3 lg:border-b-0 lg:border-l-0 lg:border-r lg:px-3">
          <dt class="text-xs font-medium text-soft">
            Tokens processed
          </dt>
          <dd
            class="mt-1 text-xl font-semibold tabular-nums text-bright"
            :title="fmtTokens(totals.totalTokens)"
          >
            {{ fmtCompact(totals.totalTokens) }}
          </dd>
          <p class="mt-1 text-xs leading-relaxed text-soft">
            Input, output, and cache tokens
          </p>
        </div>
        <div class="py-4 pr-3 lg:border-r border-subtle lg:px-3">
          <dt class="text-xs font-medium text-soft">
            Model calls
          </dt>
          <dd class="mt-1 text-xl font-semibold tabular-nums text-bright">
            {{ fmtTokens(totals.apiCalls) }}
          </dd>
          <p class="mt-1 text-xs leading-relaxed text-soft">
            Calls reported by the providers
          </p>
        </div>
        <div class="border-l border-subtle py-4 pl-3 lg:border-l-0 lg:pl-3">
          <dt class="text-xs font-medium text-soft">
            Harper sessions
          </dt>
          <dd class="mt-1 text-xl font-semibold tabular-nums text-bright">
            {{ fmtTokens(totals.sessions) }}
          </dd>
          <p class="mt-1 text-xs leading-relaxed text-soft">
            Portfolio reviews and conversations
          </p>
        </div>
      </dl>

      <p class="mt-3 text-xs leading-relaxed text-soft">
        {{ fmtCompact(totals.inputTokens) }} input · {{ fmtCompact(totals.outputTokens) }} output ·
        {{ fmtCompact(totals.cacheTokens) }} cache · {{ fmtCompact(totals.reasoningTokens) }} reasoning.
        Reasoning is reported separately and is not added to the token total again.
      </p>

      <UAlert
        v-if="totals.hasUnknownCost"
        class="mt-4"
        color="warning"
        variant="subtle"
        icon="i-lucide-circle-dollar-sign"
        title="Some historical calls are unpriced"
        description="The activity is included, but a usable price was not recorded for every item."
      />

      <UCollapsible class="mt-4 border-t border-subtle pt-1">
        <template #default="{ open }">
          <UButton
            color="neutral"
            variant="ghost"
            block
            :label="open ? 'Hide technical cost details' : `Technical cost details · ${modelBreakdown.length}`"
            :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="min-h-11 justify-between px-0 text-sm"
          />
        </template>
        <template #content>
          <div class="overflow-x-auto pb-1 pt-2">
            <table class="w-full min-w-xl text-sm">
              <caption class="sr-only">
                Models, providers, sessions, tokens, and cost for the selected period
              </caption>
              <thead class="border-b border-subtle text-xs text-soft">
                <tr>
                  <th
                    scope="col"
                    class="px-2 py-2 text-left font-medium"
                  >
                    Model
                  </th>
                  <th
                    scope="col"
                    class="px-2 py-2 text-left font-medium"
                  >
                    Provider
                  </th>
                  <th
                    scope="col"
                    class="px-2 py-2 text-right font-medium"
                  >
                    Sessions
                  </th>
                  <th
                    scope="col"
                    class="px-2 py-2 text-right font-medium"
                  >
                    Tokens
                  </th>
                  <th
                    scope="col"
                    class="px-2 py-2 text-right font-medium"
                  >
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-subtle">
                <tr
                  v-for="model in modelBreakdown"
                  :key="`${model.provider}:${model.model}`"
                >
                  <th
                    scope="row"
                    class="px-2 py-3 text-left font-medium text-default"
                  >
                    {{ model.model }}
                  </th>
                  <td class="px-2 py-3 text-left text-soft">
                    {{ model.provider }}
                  </td>
                  <td class="px-2 py-3 text-right tabular-nums text-soft">
                    {{ fmtTokens(model.sessionCount) }}
                  </td>
                  <td class="px-2 py-3 text-right tabular-nums text-soft">
                    {{ fmtTokens(model.tokens) }}
                  </td>
                  <td class="px-2 py-3 text-right tabular-nums text-soft">
                    {{ model.costLabel }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </UCollapsible>
    </div>

    <UAlert
      v-else
      class="mt-5"
      color="neutral"
      variant="subtle"
      icon="i-lucide-chart-no-axes-column"
      :title="emptyTitle"
      description="Running costs will appear after Harper completes its next portfolio review or conversation."
    />
  </section>
</template>
