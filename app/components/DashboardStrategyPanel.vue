<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from 'vue'

const props = defineProps<{
  theses: any[]
  candidates: any[]
  runs: any[]
  decisions: any[]
  schedule: any
}>()

const parseJson = (value: string | null | undefined) => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const { number } = useDashboardFormat()
const fmt = (value: number | null | undefined, digits = 1) =>
  number(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })

const thesisRows = computed(() => (props.theses ?? []).map((thesis: any) => {
  const contract = parseJson(thesis.thesis_contract_json) ?? {}
  const scenario = parseJson(thesis.scenario_json) ?? {}
  return {
    ...thesis,
    contract,
    scenario,
    starter: Boolean(contract.starter_position || contract.is_starter || contract.starter),
    confirmation: contract.confirmation_source || contract.confirmation_evidence || null
  }
}))

const latestCandidates = computed(() => (props.candidates ?? []).slice(0, 10).map((candidate: any) => ({
  ...candidate,
  hardGates: parseJson(candidate.hard_gates_json) ?? {},
  scores: parseJson(candidate.score_components_json) ?? {}
})))

const latestRun = computed(() => props.runs?.[0] ?? null)
const latestDecision = computed(() => props.decisions?.[0] ?? null)
const failedGateCount = (candidate: any) => Object.values(candidate.hardGates ?? {})
  .filter(value => ['FAIL', 'FAILED', 'FALSE', '0', false, 0].includes(value as any)).length
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-bright">
            Strategy and execution contract
          </h2>
          <p class="mt-1 text-xs leading-relaxed text-soft">
            The thesis model, scenario economics, hard gates, version history, and operating schedule currently governing Harper.
          </p>
        </div>
        <UBadge
          :label="latestRun?.decision_model_version || 'Model version unavailable'"
          color="neutral"
          variant="soft"
        />
      </div>
    </template>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="rounded-lg border border-subtle p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-soft">
          Current versions
        </p>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-soft">
              Decision model
            </dt><dd class="font-medium text-bright">
              {{ latestRun?.decision_model_version || latestDecision?.decision_model_version || '—' }}
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-soft">
              Parameters
            </dt><dd class="font-medium text-bright">
              {{ latestRun?.parameter_version || latestDecision?.parameter_version || '—' }}
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-soft">
              Schedule
            </dt><dd class="font-medium text-bright">
              {{ latestRun?.schedule_version || schedule?.version || '—' }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="rounded-lg border border-subtle p-4 lg:col-span-2">
        <p class="text-xs font-medium uppercase tracking-wide text-soft">
          Operating schedule · {{ schedule?.timezone || 'Market time zone unavailable' }}
        </p>
        <div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="session in schedule?.sessions ?? []"
            :key="session.time"
            class="rounded-md bg-muted/40 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold tabular-nums text-bright">{{ session.time }}</span>
              <UBadge
                :label="session.can_trade ? 'Trading window' : 'No trade'"
                :color="session.can_trade ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              />
            </div>
            <p class="mt-1 text-xs font-medium text-default">
              {{ session.label }}
            </p>
            <p class="mt-1 text-xs leading-relaxed text-soft">
              {{ session.purpose }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <UCollapsible
      v-if="thesisRows.length"
      class="mt-5 border-t border-subtle pt-2"
    >
      <template #default="{ open }">
        <UButton
          color="neutral"
          variant="ghost"
          block
          :label="open ? 'Hide thesis contracts' : `View active thesis contracts · ${thesisRows.length}`"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="min-h-11 justify-between px-0"
        />
      </template>
      <template #content>
        <div class="grid gap-3 pt-3 lg:grid-cols-2">
          <article
            v-for="thesis in thesisRows"
            :key="thesis.ticker"
            class="rounded-lg border border-subtle p-4"
          >
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-semibold text-bright">
                {{ thesis.ticker }}
              </h3>
              <UBadge
                :label="thesis.thesis_type || 'CATALYST'"
                color="primary"
                variant="soft"
                size="sm"
              />
              <UBadge
                v-if="thesis.starter"
                label="Starter position"
                color="warning"
                variant="soft"
                size="sm"
              />
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt class="text-xs text-soft">
                  Investment success
                </dt><dd class="mt-1 font-semibold text-bright">
                  {{ thesis.investment_success_probability == null ? '—' : `${fmt(thesis.investment_success_probability * (thesis.investment_success_probability <= 1 ? 100 : 1), 0)}%` }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-soft">
                  Expected return
                </dt><dd class="mt-1 font-semibold text-bright">
                  {{ thesis.expected_return_pct == null ? '—' : `${fmt(thesis.expected_return_pct, 2)}%` }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-soft">
                  Review date
                </dt><dd class="mt-1 text-default">
                  {{ thesis.review_date || '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-soft">
                  EV model
                </dt><dd class="mt-1 text-default">
                  {{ thesis.ev_model || '—' }}
                </dd>
              </div>
            </dl>
            <div
              v-if="Object.keys(thesis.scenario).length"
              class="mt-3 rounded-md bg-muted/40 p-3 text-xs text-soft"
            >
              <p class="font-medium text-default">
                Scenario assumptions
              </p>
              <pre class="mt-1 whitespace-pre-wrap font-sans">{{ JSON.stringify(thesis.scenario, null, 2) }}</pre>
            </div>
            <p
              v-if="thesis.starter"
              class="mt-3 text-xs text-soft"
            >
              Confirmation evidence: <span class="text-default">{{ thesis.confirmation || 'Not yet recorded' }}</span>
            </p>
          </article>
        </div>
      </template>
    </UCollapsible>

    <UCollapsible
      v-if="latestCandidates.length"
      class="mt-2 border-t border-subtle pt-2"
    >
      <template #default="{ open }">
        <UButton
          color="neutral"
          variant="ghost"
          block
          :label="open ? 'Hide candidate gate details' : `View candidate gates and scores · ${latestCandidates.length}`"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="min-h-11 justify-between px-0"
        />
      </template>
      <template #content>
        <div class="divide-y divide-subtle pt-2">
          <div
            v-for="candidate in latestCandidates"
            :key="candidate.evaluation_id"
            class="py-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-bright">{{ candidate.ticker }}</span>
                <UBadge
                  :label="candidate.shadow_recommendation || candidate.status"
                  :color="candidate.hard_gate_pass === 1 ? 'success' : 'warning'"
                  variant="subtle"
                  size="sm"
                />
                <span class="text-xs text-soft">{{ failedGateCount(candidate) }} hard-gate failures</span>
              </div>
              <span class="text-sm font-semibold tabular-nums text-bright">{{ fmt(candidate.weighted_score ?? candidate.preliminary_score, 1) }}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <UBadge
                v-for="(value, key) in candidate.hardGates"
                :key="String(key)"
                :label="`${String(key)}: ${String(value)}`"
                :color="['FAIL', 'FAILED', 'FALSE', '0'].includes(String(value).toUpperCase()) ? 'error' : 'neutral'"
                variant="soft"
                size="sm"
              />
            </div>
          </div>
        </div>
      </template>
    </UCollapsible>
  </UCard>
</template>
