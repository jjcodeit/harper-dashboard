<script setup lang="ts">
type DashboardSession = {
  label: string
  time: string
  purpose: string
  market_time?: string
  user_time?: string
  user_timezone?: string
}

type DashboardSchedule = {
  timezone?: string
  sessions?: DashboardSession[]
}

type DashboardMarketAdapter = {
  status?: string
  display_name?: string
}

const props = defineProps<{
  schedule?: DashboardSchedule
  marketAdapter?: DashboardMarketAdapter
}>()

const checks = [
  { title: 'Reliable evidence', description: 'Important claims must be supported by trustworthy sources.' },
  { title: 'Enough potential upside', description: 'The possible gain must justify the planned downside after estimated costs.' },
  { title: 'Clear risk limit', description: 'Every investment needs a price and condition that would prove the idea wrong.' },
  { title: 'Current market data', description: 'Harper will not act on an old or mismatched price.' },
  { title: 'Portfolio fit', description: 'A new investment must stay within concentration and total-risk limits.' }
]

const sessions = computed(() => props.schedule?.sessions ?? [])
const scheduleTimezone = computed(() =>
  sessions.value[0]?.user_timezone || props.schedule?.timezone || null
)
</script>

<template>
  <section
    id="how-harper-works"
    aria-labelledby="how-harper-works-title"
    class="border-y border-subtle py-7"
  >
    <div class="grid gap-7 lg:grid-cols-[0.75fr_1.25fr]">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          How Harper works
        </p>
        <h2
          id="how-harper-works-title"
          class="font-display mt-1 text-xl font-bold tracking-tight text-bright md:text-2xl"
        >
          The checks before a virtual investment
        </h2>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-soft">
          The same evidence, price, and risk checks apply in every configured market.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <UBadge
            :label="marketAdapter?.status === 'OPERATIONAL' ? 'Market adapter reviewed' : 'Market adapter still being verified'"
            :color="marketAdapter?.status === 'OPERATIONAL' ? 'success' : 'warning'"
            variant="soft"
          />
          <UBadge
            :label="marketAdapter?.display_name ?? 'Market unavailable'"
            color="neutral"
            variant="outline"
          />
        </div>
      </div>

      <div>
        <ol class="divide-y divide-subtle border-y border-subtle">
          <li
            v-for="(check, index) in checks"
            :key="check.title"
            class="grid gap-2 py-3 sm:grid-cols-[2rem_11rem_1fr] sm:items-start"
          >
            <span class="text-xs font-semibold tabular-nums text-faint">{{ index + 1 }}</span>
            <strong class="text-sm font-semibold text-bright">{{ check.title }}</strong>
            <span class="text-sm leading-relaxed text-soft">{{ check.description }}</span>
          </li>
        </ol>

        <UCollapsible class="mt-3">
          <template #default="{ open }">
            <UButton
              color="neutral"
              variant="ghost"
              block
              :label="open ? 'Hide market review times' : 'When Harper checks the market'"
              :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="min-h-11 justify-between px-0"
            />
          </template>
          <template #content>
            <div
              v-if="sessions.length"
              class="pb-1 pt-3"
            >
              <p class="text-xs leading-relaxed text-soft">
                Review times are shown in {{ scheduleTimezone }}. Market-local times use {{ schedule?.timezone }}.
              </p>
              <dl class="mt-3 divide-y divide-subtle border-y border-subtle">
                <div
                  v-for="session in sessions"
                  :key="`${session.label}-${session.time}`"
                  class="flex items-start justify-between gap-5 py-3"
                >
                  <div>
                    <dt class="text-sm font-medium text-bright">
                      {{ session.purpose }}
                    </dt>
                    <p class="mt-0.5 text-xs text-soft">
                      {{ session.label }}
                    </p>
                  </div>
                  <dd class="shrink-0 text-right text-sm tabular-nums text-default">
                    <span class="font-semibold">{{ session.user_time ?? session.time }}</span>
                    <span
                      v-if="session.market_time && session.market_time !== session.user_time"
                      class="mt-0.5 block text-xs text-soft"
                    >
                      {{ session.market_time }} market time
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
            <UAlert
              v-else
              color="warning"
              variant="soft"
              icon="i-lucide-clock-alert"
              title="Market schedule unavailable"
              description="The market adapter needs a verified time zone and session schedule before review times can be shown."
            />
          </template>
        </UCollapsible>
      </div>
    </div>
  </section>
</template>
