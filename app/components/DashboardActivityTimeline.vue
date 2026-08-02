<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed } from 'vue'

const props = defineProps<{
  trades: any[]
  journal: any[]
  decisions: any[]
}>()

const { money, dateTime } = useDashboardFormat()
const fmtTime = (value: string | null | undefined) => dateTime(value, { dateStyle: undefined, timeStyle: 'short' })
const fmtDay = (value: string) => dateTime(value, { dateStyle: 'full', timeStyle: undefined })

const stripSuffix = (ticker: string) => ticker.replace(/\.(NS|BO)$/, '')

type TimelineFilter = 'all' | 'trades' | 'decisions'
const filter = ref<TimelineFilter>('all')
const expandedIds = ref(new Set<string>())

interface TimelineEvent {
  id: string
  timestamp: string
  type: 'trade' | 'decision'
  ticker?: string
  label: string
  title: string
  detail: string
  meta?: string
}

const actionLabel = (action: string) => {
  const normalized = action?.toUpperCase()
  if (normalized === 'BUY') return 'Bought'
  if (normalized === 'SELL') return 'Sold'
  if (normalized === 'HOLD') return 'Held'
  return action ? action.charAt(0).toUpperCase() + action.slice(1).toLowerCase() : 'Trade recorded'
}

const journalLabel = (type: string) => {
  const normalized = type?.toLowerCase().replace(/[_-]+/g, ' ')
  if (normalized?.includes('review') || normalized?.includes('daily')) return 'Reviewed'
  if (normalized?.includes('hold')) return 'Held'
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Decision recorded'
}

const events = computed<TimelineEvent[]>(() => {
  const result: TimelineEvent[] = []

  for (const trade of props.trades ?? []) {
    result.push({
      id: `trade-${trade.timestamp}-${trade.ticker}-${trade.action}`,
      timestamp: trade.timestamp,
      type: 'trade',
      ticker: trade.ticker,
      label: actionLabel(trade.action),
      title: `${actionLabel(trade.action)} ${trade.shares} ${stripSuffix(trade.ticker)} at ${money(trade.price)}`,
      detail: trade.reason || 'No reason was recorded for this trade.',
      meta: money(Math.abs(trade.total))
    })
  }

  for (const decision of props.decisions ?? []) {
    const action = String(decision.action ?? 'DECISION').replaceAll('_', ' ')
    result.push({
      id: `decision-${decision.id}-${decision.timestamp}`,
      timestamp: decision.timestamp,
      type: 'decision',
      ticker: decision.ticker,
      label: action === 'NO TRADE' ? 'No trade' : actionLabel(action),
      title: decision.ticker
        ? `${action === 'NO TRADE' ? 'No trade' : actionLabel(action)} · ${stripSuffix(decision.ticker)}`
        : (action === 'NO TRADE' ? 'No trade' : actionLabel(action)),
      detail: decision.rationale || 'No rationale was recorded.'
    })
  }

  for (const entry of props.journal ?? []) {
    const duplicateTrade = (props.trades ?? []).some((trade: any) => {
      const timestampsMatch = Math.abs(new Date(trade.timestamp).getTime() - new Date(entry.timestamp).getTime()) < 60_000
      const content = String(entry.content ?? '').toLowerCase()
      return timestampsMatch
        && content.includes(String(trade.action ?? '').toLowerCase())
        && content.includes(stripSuffix(trade.ticker).toLowerCase())
    })
    if (duplicateTrade) continue

    result.push({
      id: `journal-${entry.timestamp}-${entry.entry_type}`,
      timestamp: entry.timestamp,
      type: 'decision',
      label: journalLabel(entry.entry_type),
      title: journalLabel(entry.entry_type),
      detail: entry.content
    })
  }

  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const filteredEvents = computed(() =>
  filter.value === 'all'
    ? events.value
    : events.value.filter(event => filter.value === 'trades' ? event.type === 'trade' : event.type === 'decision')
)

const groups = computed(() => {
  const result: { key: string, label: string, events: TimelineEvent[] }[] = []
  for (const event of filteredEvents.value) {
    const key = new Date(event.timestamp).toISOString().slice(0, 10)
    let group = result.find(candidate => candidate.key === key)
    if (!group) {
      group = { key, label: fmtDay(event.timestamp), events: [] }
      result.push(group)
    }
    group.events.push(event)
  }
  return result
})

const toggleDetail = (id: string) => {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

const visibleDetail = (event: TimelineEvent) =>
  event.detail.length > 260 && !expandedIds.value.has(event.id)
    ? `${event.detail.slice(0, 260).trim()}…`
    : event.detail
</script>

<template>
  <section aria-labelledby="recent-decisions-title">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2
          id="recent-decisions-title"
          class="text-base font-semibold text-bright"
        >
          Recent decisions
        </h2>
        <p class="mt-1 text-xs leading-relaxed text-soft">
          Portfolio actions and the reasons Harper recorded for them.
        </p>
      </div>
      <div class="flex flex-wrap gap-1">
        <UButton
          v-for="option in ([{ value: 'all', label: 'All decisions' }, { value: 'trades', label: 'Trades' }, { value: 'decisions', label: 'Decisions' }] as const)"
          :key="option.value"
          :label="option.label"
          color="neutral"
          size="sm"
          :variant="filter === option.value ? 'soft' : 'ghost'"
          class="min-h-9"
          @click="filter = option.value"
        />
      </div>
    </div>

    <div
      v-if="!groups.length"
      class="mt-5 rounded-lg bg-elevated px-4 py-6 text-center text-sm text-soft"
    >
      No trades or portfolio decisions have been recorded yet.
    </div>

    <div
      v-else
      class="mt-5 space-y-6"
    >
      <section
        v-for="group in groups"
        :key="group.key"
        :aria-labelledby="`activity-${group.key}`"
      >
        <h3
          :id="`activity-${group.key}`"
          class="text-xs font-medium text-soft"
        >
          {{ group.label }}
        </h3>
        <ol class="mt-2 divide-y divide-subtle border-y border-subtle">
          <li
            v-for="event in group.events"
            :key="event.id"
            class="flex gap-3 py-4"
          >
            <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated text-primary">
              <UIcon
                :name="event.type === 'trade' ? 'i-lucide-arrow-left-right' : 'i-lucide-notebook-pen'"
                class="size-4"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  :label="event.label"
                  :color="event.type === 'trade' ? 'info' : 'neutral'"
                  variant="subtle"
                  size="sm"
                />
                <UBadge
                  v-if="event.ticker"
                  :label="stripSuffix(event.ticker)"
                  color="neutral"
                  variant="outline"
                  size="sm"
                />
                <time
                  :datetime="event.timestamp"
                  class="ml-auto text-xs tabular-nums text-soft"
                >
                  {{ fmtTime(event.timestamp) }}
                </time>
              </div>
              <div class="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h4 class="text-sm font-medium text-bright">
                  {{ event.title }}
                </h4>
                <span
                  v-if="event.meta"
                  class="text-xs tabular-nums text-soft"
                >
                  {{ event.meta }}
                </span>
              </div>
              <p class="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-default">
                {{ visibleDetail(event) }}
              </p>
              <UButton
                v-if="event.detail.length > 260"
                :label="expandedIds.has(event.id) ? 'Show less' : 'Read full reason'"
                :trailing-icon="expandedIds.has(event.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                color="neutral"
                variant="link"
                size="sm"
                class="mt-1 min-h-9 px-0"
                @click="toggleDetail(event.id)"
              />
            </div>
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>
