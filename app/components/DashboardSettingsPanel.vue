<script setup lang="ts">
type DashboardProfile = {
  portfolio_currency?: string
  initial_capital?: number
}

type DashboardPortfolioConfig = {
  market_label?: string
  benchmark_name?: string
  cost_mode?: string
}

type DashboardMarketAdapter = {
  market_timezone?: string
}

defineProps<{
  profile?: DashboardProfile
  portfolioConfig?: DashboardPortfolioConfig
  marketAdapter?: DashboardMarketAdapter
}>()

const dashboardFormat = useDashboardFormat()
const draftLocale = ref(dashboardFormat.locale.value)
const draftTimezone = ref(dashboardFormat.timezone.value)
const error = ref<string | null>(null)
const saved = ref(false)

watch(() => dashboardFormat.locale.value, (value) => {
  draftLocale.value = value
})
watch(() => dashboardFormat.timezone.value, (value) => {
  draftTimezone.value = value
})

const savePreferences = () => {
  error.value = null
  saved.value = false
  try {
    new Intl.NumberFormat(draftLocale.value).format(1000)
    new Intl.DateTimeFormat(draftLocale.value, { timeZone: draftTimezone.value }).format(new Date())
  } catch {
    error.value = 'Use a valid language and region code and an IANA time zone.'
    return
  }
  dashboardFormat.locale.value = draftLocale.value
  dashboardFormat.timezone.value = draftTimezone.value
  saved.value = true
}
</script>

<template>
  <section
    id="settings"
    aria-labelledby="settings-title"
    class="scroll-mt-16 border-t border-subtle pt-8"
  >
    <div class="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Settings
        </p>
        <h2
          id="settings-title"
          class="font-display mt-1 text-xl font-bold tracking-tight text-bright md:text-2xl"
        >
          Display and portfolio settings
        </h2>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-soft">
          Choose how dates, times, and numbers appear. These preferences do not change the underlying portfolio or its history.
        </p>
      </div>

      <div class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Language and region"
            description="Use a standard locale such as en-US, en-GB, de-DE, or fr-FR."
          >
            <UInput
              v-model="draftLocale"
              class="w-full"
              autocomplete="language"
            />
          </UFormField>
          <UFormField
            label="Time zone"
            description="Dates and update times appear in this time zone."
          >
            <UInput
              v-model="draftTimezone"
              class="w-full"
              autocomplete="off"
            />
          </UFormField>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UButton
            label="Save display preferences"
            icon="i-lucide-check"
            @click="savePreferences"
          />
          <span
            v-if="saved"
            class="text-sm text-success"
          >Display preferences saved.</span>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Display preferences were not saved"
          :description="error"
        />

        <dl class="grid gap-x-6 gap-y-4 border-t border-subtle pt-5 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium text-faint">
              Portfolio currency
            </dt>
            <dd class="mt-1 text-sm font-semibold text-bright">
              {{ profile?.portfolio_currency ?? 'Unavailable' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-faint">
              Starting value
            </dt>
            <dd class="mt-1 text-sm font-semibold text-bright">
              {{ dashboardFormat.money(profile?.initial_capital) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-faint">
              Market covered
            </dt>
            <dd class="mt-1 text-sm font-semibold text-bright">
              {{ portfolioConfig?.market_label ?? 'Unavailable' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-faint">
              Performance benchmark
            </dt>
            <dd class="mt-1 text-sm font-semibold text-bright">
              {{ portfolioConfig?.benchmark_name ?? 'Absolute return only' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-faint">
              Market time zone
            </dt>
            <dd class="mt-1 text-sm font-semibold text-bright">
              {{ marketAdapter?.market_timezone ?? 'Not verified' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-faint">
              Estimated trading costs
            </dt>
            <dd class="mt-1 text-sm font-semibold text-bright">
              {{ portfolioConfig?.cost_mode === 'ADAPTER' ? 'Market-specific model' : 'Conservative fallback model' }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
