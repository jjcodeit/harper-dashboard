<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from 'vue'

const props = defineProps<{
  runs: any[]
  intelSourceStats: any[]
  intelArticlesStats: any
  dataLifecycle: any
  liveQuoteCount: number
  holdingCount: number
}>()

const { number, dateTime: fmtDateTime } = useDashboardFormat()
const fmt = (n: number | null | undefined, d = 2) =>
  number(n, { minimumFractionDigits: d, maximumFractionDigits: d })

const latestRun = computed(() => props.runs?.[0] ?? null)
const snapshotUsable = computed(() => latestRun.value?.status === 'COMPLETED')
const enabledCount = computed(() => props.intelSourceStats?.filter((source: any) => Boolean(source.enabled)).length ?? 0)
const totalSources = computed(() => props.intelSourceStats?.length ?? 0)
const totalDuplicates = computed(() => props.intelSourceStats?.reduce((total: number, source: any) => total + (source.duplicate_count ?? 0), 0) ?? 0)
const totalFetched = computed(() => props.intelSourceStats?.reduce((total: number, source: any) => total + (source.total_fetched ?? 0), 0) ?? 0)
const duplicatePct = computed(() => totalFetched.value > 0 ? (totalDuplicates.value / totalFetched.value) * 100 : 0)
const hotWorkingRows = computed(() => {
  const lifecycle = props.dataLifecycle
  if (!lifecycle) return null
  return (lifecycle.hot_intel_articles ?? 0)
    + (lifecycle.hot_market_feed ?? 0)
    + (lifecycle.hot_research ?? 0)
    + (lifecycle.hot_quotes ?? 0)
    + (lifecycle.hot_historical_prices ?? 0)
})

const lastIntelFetch = computed(() => {
  const timestamps = (props.intelSourceStats ?? [])
    .map((source: any) => source.last_fetch_at)
    .filter(Boolean)
    .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())
  return timestamps[0] ?? null
})

const quoteLabel = computed(() => {
  if (!props.holdingCount) return 'No open investments'
  if (props.liveQuoteCount === props.holdingCount) return 'All open investment prices are current'
  if (props.liveQuoteCount > 0) return `${props.liveQuoteCount} of ${props.holdingCount} open investment prices are current`
  return 'Open investments are showing their last available prices'
})

const runColor = (status: string | null | undefined) => status === 'COMPLETED' ? 'success' : status ? 'warning' : 'neutral'
</script>

<template>
  <section aria-labelledby="data-status-title">
    <div>
      <h2
        id="data-status-title"
        class="text-base font-semibold text-bright"
      >
        Data status
      </h2>
      <p class="mt-1 text-xs leading-relaxed text-soft">
        Whether the portfolio snapshot, prices, and research sources are usable.
      </p>
    </div>

    <UAlert
      v-if="!snapshotUsable"
      class="mt-5"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Portfolio data needs review"
      :description="latestRun ? `The latest portfolio update is ${String(latestRun.status).toLowerCase()}. Harper is showing the last available values.` : 'No completed portfolio update is available.'"
    />

    <div
      v-else
      class="mt-5 flex items-start gap-3 border-l-2 border-success pl-3"
      aria-live="polite"
    >
      <UIcon
        name="i-lucide-circle-check"
        class="mt-0.5 size-4 shrink-0 text-success"
      />
      <div>
        <h3 class="text-sm font-medium text-bright">
          Portfolio data is usable
        </h3>
        <p class="mt-1 text-xs leading-relaxed text-soft">
          The latest portfolio update completed {{ fmtDateTime(latestRun?.completed_at || latestRun?.created_at) }}.
        </p>
      </div>
    </div>

    <dl class="mt-5 divide-y divide-subtle border-y border-subtle text-sm">
      <div class="flex items-start justify-between gap-4 py-3">
        <div>
          <dt class="font-medium text-default">
            Price status
          </dt>
          <p class="mt-0.5 text-xs text-soft">
            Price status follows the latest complete portfolio valuation.
          </p>
        </div>
        <dd class="text-right">
          <UBadge
            :label="quoteLabel"
            :color="holdingCount && liveQuoteCount === holdingCount ? 'success' : holdingCount ? 'warning' : 'neutral'"
            variant="subtle"
            size="sm"
          />
        </dd>
      </div>
      <div class="flex items-start justify-between gap-4 py-3">
        <div>
          <dt class="font-medium text-default">
            Data sources
          </dt>
          <p class="mt-0.5 text-xs text-soft">
            News and market sources Harper checks for evidence.
          </p>
        </div>
        <dd class="shrink-0 tabular-nums text-soft">
          {{ enabledCount }} of {{ totalSources }} active
        </dd>
      </div>
      <div class="flex items-start justify-between gap-4 py-3">
        <div>
          <dt class="font-medium text-default">
            Last research fetch
          </dt>
          <p class="mt-0.5 text-xs text-soft">
            Most recent source collection time.
          </p>
        </div>
        <dd class="shrink-0 tabular-nums text-soft">
          {{ fmtDateTime(lastIntelFetch) }}
        </dd>
      </div>
      <div class="flex items-start justify-between gap-4 py-3">
        <div>
          <dt class="font-medium text-default">
            Duplicates removed
          </dt>
          <p class="mt-0.5 text-xs text-soft">
            Repeated source items excluded from the research feed.
          </p>
        </div>
        <dd class="shrink-0 tabular-nums text-soft">
          {{ fmt(duplicatePct, 0) }}%
        </dd>
      </div>
      <div class="flex items-start justify-between gap-4 py-3">
        <div>
          <dt class="font-medium text-default">
            Working data
          </dt>
          <p class="mt-0.5 text-xs text-soft">
            Active research and market rows kept available to Harper.
          </p>
        </div>
        <dd class="shrink-0 tabular-nums text-soft">
          {{ hotWorkingRows == null ? '—' : fmt(hotWorkingRows, 0) }}
        </dd>
      </div>
      <div class="flex items-start justify-between gap-4 py-3">
        <div>
          <dt class="font-medium text-default">
            Local archive
          </dt>
          <p class="mt-0.5 text-xs text-soft">
            Cold rows excluded from normal research and cloud sync.
          </p>
        </div>
        <dd class="shrink-0 tabular-nums text-soft">
          {{ dataLifecycle ? fmt(dataLifecycle.archived_rows, 0) : '—' }}
        </dd>
      </div>
      <div class="flex items-start justify-between gap-4 py-3">
        <div>
          <dt class="font-medium text-default">
            Last cleanup
          </dt>
          <p class="mt-0.5 text-xs text-soft">
            {{ dataLifecycle ? `${fmt(dataLifecycle.last_archived_rows, 0)} archived · ${fmt(dataLifecycle.last_purged_rows, 0)} removed` : 'No lifecycle report is available.' }}
          </p>
        </div>
        <dd class="shrink-0 tabular-nums text-soft">
          {{ fmtDateTime(dataLifecycle?.last_maintained_at) }}
        </dd>
      </div>
    </dl>

    <UCollapsible
      v-if="latestRun?.report"
      class="mt-4"
    >
      <template #default="{ open }">
        <UButton
          color="neutral"
          variant="ghost"
          block
          :label="open ? 'Hide latest run report' : 'Read latest run report'"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="min-h-11 justify-between px-0 text-sm"
        />
      </template>
      <template #content>
        <p class="whitespace-pre-wrap border-l-2 border-subtle py-1 pl-3 text-sm leading-relaxed text-default">
          {{ latestRun.report }}
        </p>
      </template>
    </UCollapsible>

    <UCollapsible
      v-if="runs?.length"
      class="mt-2 border-t border-subtle pt-1"
    >
      <template #default="{ open }">
        <UButton
          color="neutral"
          variant="ghost"
          block
          :label="open ? 'Hide run history' : `View run history · ${runs.length}`"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="min-h-11 justify-between px-0 text-sm"
        />
      </template>
      <template #content>
        <div class="divide-y divide-subtle pb-1 pt-2">
          <UCollapsible
            v-for="run in runs"
            :key="run.id"
            class="py-3"
          >
            <template #default="{ open }">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-medium text-bright">{{ run.market_date }}</span>
                    <UBadge
                      :label="run.status"
                      :color="runColor(run.status)"
                      variant="subtle"
                      size="sm"
                    />
                    <span class="text-xs text-soft">{{ run.session_label || 'Session not labeled' }}</span>
                  </div>
                  <p class="mt-1 text-xs tabular-nums text-soft">
                    {{ fmtDateTime(run.completed_at || run.created_at) }}
                  </p>
                </div>
                <UButton
                  v-if="run.report"
                  :label="open ? 'Hide report' : 'View report'"
                  :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="min-h-9 shrink-0"
                />
              </div>
            </template>
            <template #content>
              <p class="mt-3 whitespace-pre-wrap border-l-2 border-subtle pl-3 text-sm leading-relaxed text-default">
                {{ run.report }}
              </p>
            </template>
          </UCollapsible>
        </div>
      </template>
    </UCollapsible>

    <UCollapsible
      v-if="intelSourceStats?.length"
      class="mt-2 border-t border-subtle pt-1"
    >
      <template #default="{ open }">
        <UButton
          color="neutral"
          variant="ghost"
          block
          :label="open ? 'Hide data sources' : `Data sources · ${totalSources}`"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="min-h-11 justify-between px-0 text-sm"
        />
      </template>
      <template #content>
        <div class="overflow-x-auto pb-1 pt-3">
          <table class="w-full min-w-2xl text-sm">
            <caption class="sr-only">
              Research data sources, collection totals, duplicate counts, and availability
            </caption>
            <thead class="border-b border-subtle text-xs text-soft">
              <tr>
                <th
                  scope="col"
                  class="px-2 py-2 text-left font-medium"
                >
                  Source
                </th>
                <th
                  scope="col"
                  class="px-2 py-2 text-right font-medium"
                >
                  Items fetched
                </th>
                <th
                  scope="col"
                  class="px-2 py-2 text-right font-medium"
                >
                  Duplicates removed
                </th>
                <th
                  scope="col"
                  class="px-2 py-2 text-right font-medium"
                >
                  Duplicate rate
                </th>
                <th
                  scope="col"
                  class="px-2 py-2 text-right font-medium"
                >
                  Relevance
                </th>
                <th
                  scope="col"
                  class="px-2 py-2 text-right font-medium"
                >
                  Rescued
                </th>
                <th
                  scope="col"
                  class="px-2 py-2 text-right font-medium"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-subtle">
              <tr
                v-for="source in intelSourceStats"
                :key="source.id"
              >
                <th
                  scope="row"
                  class="px-2 py-3 text-left font-normal text-default"
                >
                  {{ source.name }}
                </th>
                <td class="px-2 py-3 text-right tabular-nums text-soft">
                  {{ source.total_fetched }}
                </td>
                <td class="px-2 py-3 text-right tabular-nums text-soft">
                  {{ source.duplicate_count }}
                </td>
                <td class="px-2 py-3 text-right tabular-nums text-soft">
                  {{ fmt(source.dup_pct, 0) }}%
                </td>
                <td class="px-2 py-3 text-right tabular-nums text-soft">
                  {{ source.relevance_checked ? `${fmt(source.relevance_pass_rate * 100, 0)}%` : '—' }}
                </td>
                <td class="px-2 py-3 text-right tabular-nums text-soft">
                  {{ source.llm_rescued_count ?? 0 }}
                </td>
                <td class="px-2 py-3 text-right">
                  <UBadge
                    :label="source.enabled ? 'Active' : 'Unavailable'"
                    :color="source.enabled ? 'success' : 'warning'"
                    variant="subtle"
                    size="sm"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-xs text-soft">
          {{ intelArticlesStats?.total ?? 0 }} research articles are currently indexed.
        </p>
      </template>
    </UCollapsible>
  </section>
</template>
