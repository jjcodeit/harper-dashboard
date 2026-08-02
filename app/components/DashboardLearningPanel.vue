<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from 'vue'

const props = defineProps<{
  learning: any
  sources: any[]
  thesesClosed: any[]
}>()

const MIN_MEANINGFUL_SAMPLE = 5

const { number, date: fmtDate } = useDashboardFormat()
const fmt = (n: number | null | undefined, d = 2) =>
  number(n, { minimumFractionDigits: d, maximumFractionDigits: d })

const stripSuffix = (ticker: string) => ticker.replace(/\.(NS|BO)$/, '')

const closedCount = computed(() => props.thesesClosed?.length ?? 0)
const hasMeaningfulSample = computed(() => closedCount.value >= MIN_MEANINGFUL_SAMPLE)

const observedSources = computed(() => (props.sources ?? [])
  .map((source: any) => ({
    ...source,
    observations: (source.wins ?? 0) + (source.losses ?? 0)
  }))
  .filter((source: any) => source.observations > 0)
  .sort((a: any, b: any) => b.observations - a.observations))

const winRate = computed(() => {
  if (!hasMeaningfulSample.value || props.learning?.win_rate_pct == null) return null
  return props.learning.win_rate_pct
})

const outcomeColor = (outcome: string | null | undefined) => {
  if (outcome === 'WIN') return 'success'
  if (outcome === 'LOSS') return 'error'
  return 'neutral'
}
</script>

<template>
  <section aria-labelledby="lessons-title">
    <div>
      <h2
        id="lessons-title"
        class="text-base font-semibold text-bright"
      >
        Lessons from completed decisions
      </h2>
      <p class="mt-1 text-xs leading-relaxed text-soft">
        What Harper learned after investment ideas were closed.
      </p>
    </div>

    <div
      v-if="!closedCount"
      class="mt-5 rounded-xl bg-elevated px-4 py-6 text-center"
    >
      <UIcon
        name="i-lucide-graduation-cap"
        class="mx-auto size-5 text-faint"
      />
      <p class="mt-2 text-sm font-medium text-bright">
        No investment idea has been completed yet
      </p>
      <p class="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-soft">
        Lessons and forecast-quality measures will appear after Harper closes an investment idea and records its outcome.
      </p>
    </div>

    <template v-else>
      <div class="mt-5 divide-y divide-subtle border-y border-subtle">
        <article
          v-for="thesis in thesesClosed.slice(0, 5)"
          :key="`${thesis.ticker}-${thesis.closed_at ?? thesis.outcome}`"
          class="py-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-sm font-medium text-bright">
              {{ stripSuffix(thesis.ticker) }}
            </h3>
            <UBadge
              :label="thesis.outcome === 'WIN' ? 'Positive outcome' : thesis.outcome === 'LOSS' ? 'Negative outcome' : 'Closed'"
              :color="outcomeColor(thesis.outcome)"
              variant="subtle"
              size="sm"
            />
            <time
              v-if="thesis.closed_at"
              :datetime="thesis.closed_at"
              class="text-xs tabular-nums text-soft"
            >
              {{ fmtDate(thesis.closed_at) }}
            </time>
          </div>
          <p
            v-if="thesis.lesson"
            class="mt-2 text-sm leading-relaxed text-default"
          >
            {{ thesis.lesson }}
          </p>
          <p
            v-else
            class="mt-2 text-sm text-soft"
          >
            No lesson was recorded for this completed idea.
          </p>
        </article>
      </div>

      <div
        v-if="winRate != null"
        class="mt-5 border-l-2 border-primary pl-3"
      >
        <div class="text-xs font-medium text-primary">
          Successful decisions <span class="font-normal">(win rate)</span>
        </div>
        <div class="mt-1 text-xl font-semibold tabular-nums text-bright">
          {{ fmt(winRate, 0) }}%
        </div>
        <p class="mt-1 text-xs leading-relaxed text-soft">
          Share of {{ closedCount }} completed investment ideas that ended positively.
        </p>
      </div>

      <div
        v-else
        class="mt-5 text-sm text-soft"
      >
        Forecast-quality summaries will appear after {{ MIN_MEANINGFUL_SAMPLE }} completed ideas. {{ closedCount }} {{ closedCount === 1 ? 'idea has' : 'ideas have' }} been completed so far.
      </div>

      <UCollapsible
        v-if="hasMeaningfulSample && (learning?.brier_score != null || learning?.calibration_drift != null)"
        class="mt-5 border-t border-subtle pt-1"
      >
        <template #default="{ open }">
          <UButton
            color="neutral"
            variant="ghost"
            block
            :label="open ? 'Hide advanced scoring' : 'Advanced scoring'"
            :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="min-h-11 justify-between px-0 text-sm"
          />
        </template>
        <template #content>
          <dl class="grid gap-4 pb-1 pt-3 sm:grid-cols-2">
            <div v-if="learning?.brier_score != null">
              <dt class="text-sm font-medium text-bright">
                Brier score
              </dt>
              <dd class="mt-1 text-lg font-semibold tabular-nums text-default">
                {{ fmt(learning.brier_score) }}
              </dd>
              <p class="mt-1 text-xs leading-relaxed text-soft">
                Advanced measure of forecast accuracy; lower is better.
              </p>
            </div>
            <div v-if="learning?.calibration_drift != null">
              <dt class="text-sm font-medium text-bright">
                Confidence accuracy
              </dt>
              <dd class="mt-1 text-lg font-semibold tabular-nums text-default">
                {{ fmt(learning.calibration_drift) }}%
              </dd>
              <p class="mt-1 text-xs leading-relaxed text-soft">
                Whether Harper's stated confidence matches actual outcomes; closer to zero is better.
              </p>
            </div>
          </dl>
        </template>
      </UCollapsible>

      <UCollapsible
        v-if="observedSources.length"
        class="mt-3 border-t border-subtle pt-1"
      >
        <template #default="{ open }">
          <UButton
            color="neutral"
            variant="ghost"
            block
            :label="open ? 'Hide source quality' : `Source quality · ${observedSources.length}`"
            :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="min-h-11 justify-between px-0 text-sm"
          />
        </template>
        <template #content>
          <div class="overflow-x-auto pb-1 pt-3">
            <table class="w-full min-w-lg text-sm">
              <caption class="sr-only">
                Research-source outcomes based on completed investment ideas
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
                    Positive outcomes
                  </th>
                  <th
                    scope="col"
                    class="px-2 py-2 text-right font-medium"
                  >
                    Observations
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-subtle">
                <tr
                  v-for="source in observedSources"
                  :key="source.domain"
                >
                  <th
                    scope="row"
                    class="px-2 py-3 text-left font-normal text-default"
                  >
                    {{ source.domain }}
                  </th>
                  <td class="px-2 py-3 text-right tabular-nums text-default">
                    {{ fmt((source.ratio ?? 0) * 100, 0) }}%
                  </td>
                  <td class="px-2 py-3 text-right tabular-nums text-soft">
                    {{ source.observations }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </UCollapsible>
    </template>
  </section>
</template>
