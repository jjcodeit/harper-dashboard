<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from 'vue'

const props = defineProps<{
  opportunity: any
  benchmarkName?: string | null
}>()

const funnel = computed(() => props.opportunity?.funnel ?? {})
const audit = computed(() => props.opportunity?.latest_audit ?? null)
const outperformance = computed(() => props.opportunity?.forward_outperformance ?? [])
const nearMisses = computed(() => props.opportunity?.near_misses ?? [])

const { number } = useDashboardFormat()
const fmt = (value: number | null | undefined, digits = 0) =>
  number(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })

const funnelSteps = computed(() => [
  { label: 'Screened', value: funnel.value.screened ?? 0, target: 40 },
  { label: 'Ranked', value: funnel.value.ranked ?? 0, target: 10 },
  { label: 'Deep research', value: funnel.value.deep ?? 0, target: 5 },
  { label: 'Approved', value: funnel.value.approved ?? 0, target: null }
])

const auditMessage = computed(() => {
  if (!audit.value) return 'The low-exposure audit has not run yet.'
  if (!audit.value.triggered) {
    return `${audit.value.sessions_observed} of ${audit.value.sessions_required} recent snapshots were checked. No sustained low-exposure audit was triggered.`
  }
  const reasons = (audit.value.diagnostics ?? []).map((reason: string) => reason.replaceAll('_', ' ')).join(', ')
  return `Exposure stayed below ${fmt(audit.value.exposure_threshold_pct)}% for ${audit.value.low_exposure_sessions} sessions. Review: ${reasons || 'full funnel found no qualifying setup'}.`
})

const plainRejectionReason = (value: string | null | undefined) => {
  const normalized = String(value ?? '').toUpperCase()
  if (!normalized) return 'No repeated reason yet'
  if (normalized.includes('EVIDENCE') || normalized.includes('SOURCE')) return 'Not enough reliable evidence'
  if (normalized.includes('REWARD') || normalized.includes('RISK')) return 'Potential return did not justify the risk'
  if (normalized.includes('QUOTE') || normalized.includes('PRICE')) return 'The latest price was not reliable enough'
  if (normalized.includes('SIZE') || normalized.includes('CONCENTRATION') || normalized.includes('PORTFOLIO')) return 'The investment did not fit the portfolio risk limits'
  if (normalized.includes('SESSION') || normalized.includes('TRAD')) return 'The market or investment was not available for a reliable simulated trade'
  return String(value).replaceAll('_', ' ').toLowerCase().replace(/^./, character => character.toUpperCase())
}
</script>

<template>
  <UCard
    id="opportunity-funnel"
    aria-labelledby="opportunity-funnel-title"
    class="scroll-mt-16"
    :ui="{ root: 'rounded-[10px] border-subtle bg-surface ring-0', body: 'p-5 md:p-6' }"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Ideas reviewed
        </p>
        <h2
          id="opportunity-funnel-title"
          class="mt-1 text-lg font-semibold text-bright"
        >
          What Harper checked before holding cash
        </h2>
        <p class="mt-1 max-w-2xl text-sm leading-relaxed text-soft">
          How many investments Harper checked, researched closely, and found suitable for the portfolio.
        </p>
      </div>
      <UBadge
        :color="audit?.triggered ? 'warning' : 'neutral'"
        variant="soft"
        :label="audit?.triggered ? 'Opportunity audit triggered' : 'No active audit alert'"
      />
    </div>

    <dl class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="step in funnelSteps"
        :key="step.label"
        class="rounded-lg border border-subtle bg-raised p-4"
      >
        <dt class="text-xs text-soft">
          {{ step.label }}
        </dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums text-bright">
          {{ step.value }}
        </dd>
        <p
          v-if="step.target != null"
          class="mt-1 text-xs text-faint"
        >
          Process target: {{ step.target }}+
        </p>
      </div>
    </dl>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      <section aria-labelledby="rejection-summary-title">
        <h3
          id="rejection-summary-title"
          class="text-sm font-semibold text-bright"
        >
          Why ideas were rejected
        </h3>
        <dl class="mt-3 divide-y divide-subtle rounded-lg border border-subtle">
          <div class="flex items-center justify-between gap-4 px-4 py-3">
            <dt class="text-sm text-soft">
              Most common reason
            </dt>
            <dd class="text-right text-sm font-medium text-bright">
              {{ plainRejectionReason(opportunity?.most_common_rejection_gate) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 px-4 py-3">
            <dt class="text-sm text-soft">
              Closely researched ideas with a recorded outcome
            </dt>
            <dd class="text-sm font-medium tabular-nums text-bright">
              {{ fmt(funnel.deep_documentation_pct, 1) }}%
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 px-4 py-3">
            <dt class="text-sm text-soft">
              Missed by one requirement
            </dt>
            <dd class="text-sm font-medium tabular-nums text-bright">
              {{ nearMisses.length }}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="forward-return-title">
        <h3
          id="forward-return-title"
          class="text-sm font-semibold text-bright"
        >
          Rejected ideas versus {{ benchmarkName || 'the portfolio benchmark' }}
        </h3>
        <div class="mt-3 overflow-hidden rounded-lg border border-subtle">
          <table class="w-full text-left text-sm">
            <thead class="bg-raised text-xs text-soft">
              <tr>
                <th class="px-3 py-2 font-medium">
                  Horizon
                </th>
                <th class="px-3 py-2 text-right font-medium">
                  Marked
                </th>
                <th class="px-3 py-2 text-right font-medium">
                  Later beat TRI
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-subtle">
              <tr
                v-for="row in outperformance"
                :key="row.horizon_sessions"
              >
                <td class="px-3 py-2 text-default">
                  {{ row.horizon_sessions }} sessions
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-default">
                  {{ row.marked }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-bright">
                  {{ row.outperformed_pct == null ? '—' : `${fmt(row.outperformed_pct, 1)}%` }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div class="mt-5 border-l-2 border-primary pl-3">
      <div class="text-xs font-semibold text-primary">
        Low-exposure check
      </div>
      <p class="mt-1 text-sm leading-relaxed text-default">
        {{ auditMessage }}
      </p>
    </div>

    <UCollapsible
      v-if="nearMisses.length"
      class="mt-5 border-t border-subtle pt-1"
    >
      <template #default="{ open }">
        <UButton
          color="neutral"
          variant="ghost"
          block
          :label="open ? 'Hide near misses' : 'See candidates rejected by one gate'"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="min-h-11 justify-between px-0 text-sm"
        />
      </template>
      <template #content>
        <ul class="divide-y divide-subtle pb-1 pt-2">
          <li
            v-for="candidate in nearMisses"
            :key="candidate.evaluation_id"
            class="flex items-start justify-between gap-4 py-3"
          >
            <div>
              <div class="text-sm font-medium text-bright">
                {{ candidate.ticker }}
              </div>
              <div class="mt-0.5 text-xs text-soft">
                {{ candidate.thesis_type }} · blocked by {{ candidate.binding_gate || 'one gate' }}
              </div>
            </div>
            <div class="text-sm font-semibold tabular-nums text-bright">
              {{ fmt(candidate.score, 1) }}
            </div>
          </li>
        </ul>
      </template>
    </UCollapsible>
  </UCard>
</template>
