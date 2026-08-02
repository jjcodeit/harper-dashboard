<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed } from 'vue'

const props = defineProps<{
  research: any[]
  feed: any[]
  enrichedHoldings: any[]
  intelSummary: string
}>()

const holdingsOnly = ref(true)

const { date: fmtDate } = useDashboardFormat()

const stripSuffix = (ticker: string) => ticker.replace(/\.(NS|BO)$/, '')

const cleanText = (value: string | null | undefined) => (value ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, '\'')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/^(rss|atom|market feed|news feed)\s*[:—-]\s*/i, '')
  .replace(/\s+/g, ' ')
  .trim()

const firstUrl = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    try {
      return firstUrl(JSON.parse(trimmed))
    } catch {
      return null
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstUrl(item)
      if (url) return url
    }
    return null
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return firstUrl(record.url) || firstUrl(record.href) || firstUrl(record.source_url)
  }
  return null
}

const sourceName = (url: string | null, fallback: string) => {
  if (!url) return fallback
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return fallback
  }
}

const holdingTickers = computed(() => props.enrichedHoldings.map((holding: any) => holding.ticker))

const tickerMentioned = (text: string) => holdingTickers.value.find((ticker) => {
  const symbol = stripSuffix(ticker).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^A-Z0-9])${symbol}([^A-Z0-9]|$)`, 'i').test(text)
}) ?? null

interface ResearchItem {
  id: string
  timestamp: string
  ticker: string | null
  source: string
  sourceUrl: string | null
  topic: string
  finding: string
  relevance: string | null
}

const items = computed<ResearchItem[]>(() => {
  const result: ResearchItem[] = []

  for (const entry of props.research ?? []) {
    const ticker = entry.ticker || null
    const sourceUrl = firstUrl(entry.sources_json)
    result.push({
      id: `research-${entry.created_at}-${entry.ticker}-${entry.topic}`,
      timestamp: entry.created_at,
      ticker,
      source: sourceName(sourceUrl, 'Harper research library'),
      sourceUrl,
      topic: cleanText(entry.topic),
      finding: cleanText(entry.findings),
      relevance: ticker && holdingTickers.value.includes(ticker)
        ? `This research is filed against ${stripSuffix(ticker)}, which is currently held in the portfolio.`
        : null
    })
  }

  for (const entry of props.feed ?? []) {
    const finding = cleanText(entry.observation)
    const ticker = tickerMentioned(finding)
    const sourceUrl = firstUrl(entry.source_urls)
    result.push({
      id: `feed-${entry.created_at}-${finding.slice(0, 40)}`,
      timestamp: entry.created_at,
      ticker,
      source: sourceName(sourceUrl, cleanText(entry.source_type) || 'Market feed'),
      sourceUrl,
      topic: ticker ? `${stripSuffix(ticker)} market update` : 'Market update',
      finding,
      relevance: ticker
        ? `This update directly mentions ${stripSuffix(ticker)}, which is currently held in the portfolio.`
        : null
    })
  }

  return result
    .filter(item => !holdingsOnly.value || (item.ticker != null && holdingTickers.value.includes(item.ticker)))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const sourceCount = computed(() => new Set(items.value.map(item => item.source)).size)
</script>

<template>
  <section aria-labelledby="research-title">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2
          id="research-title"
          class="text-base font-semibold text-bright"
        >
          Research
        </h2>
        <p class="mt-1 text-xs leading-relaxed text-soft">
          Evidence Harper has collected, with its connection to current investments made explicit.
        </p>
      </div>
      <USwitch
        v-model="holdingsOnly"
        label="Holdings only"
        description="Show research tied to open investments"
        size="sm"
      />
    </div>

    <div class="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-soft">
      <span>{{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}</span>
      <span>{{ sourceCount }} {{ sourceCount === 1 ? 'source' : 'sources' }}</span>
      <span v-if="intelSummary">{{ intelSummary }}</span>
    </div>

    <div
      v-if="!items.length"
      class="mt-5 rounded-lg bg-elevated px-4 py-6 text-center text-sm text-soft"
    >
      {{ holdingsOnly ? 'No research is currently linked to an open investment.' : 'No research has been collected yet.' }}
    </div>

    <ol
      v-else
      class="mt-4 divide-y divide-subtle border-y border-subtle"
    >
      <li
        v-for="item in items"
        :key="item.id"
        class="py-4"
      >
        <div class="flex flex-wrap items-center gap-2 text-xs text-soft">
          <UBadge
            v-if="item.ticker"
            :label="stripSuffix(item.ticker)"
            color="info"
            variant="subtle"
            size="sm"
          />
          <a
            v-if="item.sourceUrl"
            :href="item.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-9 items-center gap-1 text-primary hover:underline focus-visible:rounded-sm"
            :aria-label="`Open ${item.source} in a new tab`"
          >
            {{ item.source }}
            <UIcon
              name="i-lucide-external-link"
              class="size-3.5"
            />
          </a>
          <span v-else>{{ item.source }}</span>
          <time
            :datetime="item.timestamp"
            class="tabular-nums"
          >
            {{ fmtDate(item.timestamp) }}
          </time>
        </div>
        <h3 class="mt-2 text-sm font-medium text-bright">
          {{ item.topic }}
        </h3>
        <p class="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-default">
          {{ item.finding }}
        </p>
        <div
          v-if="item.relevance"
          class="mt-3 border-l-2 border-primary pl-3"
        >
          <div class="text-xs font-medium text-primary">
            Why it matters
          </div>
          <p class="mt-1 text-xs leading-relaxed text-soft">
            {{ item.relevance }}
          </p>
        </div>
      </li>
    </ol>
  </section>
</template>
