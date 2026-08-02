<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
defineProps<{
  holding: any
  thesis: any | null
  trades: any[]
  journal: any[]
  research: any[]
}>()

const { money, dateTime } = useDashboardFormat()
const fmtDateTime = (value: string | null | undefined) => value ? dateTime(value) : 'Not recorded'

const actionLabel = (action: string) => {
  if (action === 'BUY') return 'Bought'
  if (action === 'SELL') return 'Sold'
  if (action === 'HOLD') return 'Held'
  return action || 'Trade'
}
</script>

<template>
  <div class="grid gap-6 p-4 md:grid-cols-2 md:p-5">
    <section aria-labelledby="position-thesis-title">
      <div class="mb-3">
        <h3
          id="position-thesis-title"
          class="text-sm font-semibold text-bright"
        >
          Why Harper bought this
        </h3>
        <p class="mt-1 text-xs leading-relaxed text-soft">
          Harper's reason for expecting this investment to work.
        </p>
      </div>

      <dl
        v-if="thesis"
        class="divide-y divide-subtle border-y border-subtle text-sm"
      >
        <div class="py-3">
          <dt class="text-xs font-medium text-soft">
            Harper's view
          </dt>
          <dd class="mt-1 leading-relaxed text-default">
            {{ thesis.variant_view || 'No view was recorded.' }}
          </dd>
        </div>
        <div class="py-3">
          <dt class="text-xs font-medium text-soft">
            Harper's confidence
          </dt>
          <dd class="mt-1 font-medium tabular-nums text-bright">
            {{ thesis.confidence ?? '—' }}%
          </dd>
          <p class="mt-1 text-xs leading-relaxed text-soft">
            Strength of Harper's current belief, not a guaranteed probability of profit.
          </p>
        </div>
        <div class="py-3">
          <dt class="text-xs font-medium text-soft">
            What could move it <span class="font-normal">(catalyst)</span>
          </dt>
          <dd class="mt-1 leading-relaxed text-default">
            {{ thesis.catalyst || 'No catalyst was recorded.' }}
          </dd>
        </div>
        <div class="py-3">
          <dt class="text-xs font-medium text-error">
            What would change the view
          </dt>
          <dd class="mt-1 leading-relaxed text-default">
            {{ thesis.invalidation || 'No review condition was recorded.' }}
          </dd>
        </div>
        <div class="grid grid-cols-2 gap-4 py-3">
          <div>
            <dt class="text-xs font-medium text-soft">
              Time horizon
            </dt>
            <dd class="mt-1 text-default">
              {{ thesis.horizon || 'Not recorded' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-soft">
              Position opened
            </dt>
            <dd class="mt-1 tabular-nums text-default">
              {{ fmtDateTime(holding.opened_at) }}
            </dd>
          </div>
        </div>
      </dl>

      <p
        v-else
        class="rounded-lg bg-elevated px-4 py-3 text-sm text-soft"
      >
        No investment reason is linked to this open position.
      </p>
    </section>

    <div class="space-y-6">
      <section aria-labelledby="position-trades-title">
        <h3
          id="position-trades-title"
          class="text-sm font-semibold text-bright"
        >
          Recent trades
        </h3>
        <div
          v-if="trades.length"
          class="mt-2 divide-y divide-subtle border-y border-subtle"
        >
          <div
            v-for="trade in trades.slice(0, 5)"
            :key="`${trade.timestamp}-${trade.action}`"
            class="py-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                :label="actionLabel(trade.action)"
                color="info"
                variant="subtle"
                size="sm"
              />
              <span class="text-sm font-medium tabular-nums text-bright">
                {{ trade.shares }} × {{ money(trade.price, holding.trading_currency) }}
              </span>
              <time
                :datetime="trade.timestamp"
                class="ml-auto text-xs tabular-nums text-soft"
              >
                {{ fmtDateTime(trade.timestamp) }}
              </time>
            </div>
            <p class="mt-1.5 text-sm leading-relaxed text-default">
              {{ trade.reason || 'No reason was recorded for this trade.' }}
            </p>
          </div>
        </div>
        <p
          v-else
          class="mt-2 text-sm text-soft"
        >
          No trades are available for this position.
        </p>
      </section>

      <section aria-labelledby="position-journal-title">
        <h3
          id="position-journal-title"
          class="text-sm font-semibold text-bright"
        >
          Decision journal
        </h3>
        <div
          v-if="journal.length"
          class="mt-2 divide-y divide-subtle border-y border-subtle"
        >
          <article
            v-for="entry in journal.slice(0, 3)"
            :key="entry.timestamp"
            class="py-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                :label="entry.entry_type"
                color="neutral"
                variant="subtle"
                size="sm"
              />
              <time
                :datetime="entry.timestamp"
                class="text-xs tabular-nums text-soft"
              >
                {{ fmtDateTime(entry.timestamp) }}
              </time>
            </div>
            <p class="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-default">
              {{ entry.content }}
            </p>
          </article>
        </div>
        <p
          v-else
          class="mt-2 text-sm text-soft"
        >
          No decision-journal entry mentions this position.
        </p>
      </section>

      <section aria-labelledby="position-research-title">
        <h3
          id="position-research-title"
          class="text-sm font-semibold text-bright"
        >
          Related research
        </h3>
        <div
          v-if="research.length"
          class="mt-2 divide-y divide-subtle border-y border-subtle"
        >
          <article
            v-for="entry in research.slice(0, 3)"
            :key="`${entry.created_at}-${entry.topic}`"
            class="py-3"
          >
            <h4 class="text-sm font-medium text-primary">
              {{ entry.topic }}
            </h4>
            <p class="mt-1 text-sm leading-relaxed text-default">
              {{ entry.findings }}
            </p>
          </article>
        </div>
        <p
          v-else
          class="mt-2 text-sm text-soft"
        >
          No research is currently linked to this position.
        </p>
      </section>
    </div>
  </div>
</template>
