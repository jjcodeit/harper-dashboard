<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  computeRisk, sizeForRisk, inferPipSize, LOT_SIZES
} from '../composables/useLeverageRisk'

const { number, money } = useDashboardFormat()

// --- Form state -------------------------------------------------------------
const pair = ref('EURUSD')
const accountEquity = ref(10000)
const currentPrice = ref(1.10)
const leverage = ref(50)
const units = ref(LOT_SIZES.standard)
const pipSize = ref<number | null>(null)
const reporting = ref('USD')
const useSizing = ref(false)
const riskPct = ref(1.0)
const stopPips = ref(20)
const leverageCap = ref(20)

const result = computed(() => {
  let finalUnits = units.value
  let sizing: ReturnType<typeof sizeForRisk> | null = null
  if (useSizing.value) {
    const pip = inferPipSize(pair.value.slice(3, 6), pipSize.value)
    sizing = sizeForRisk(
      accountEquity.value, riskPct.value, stopPips.value, pip,
      leverageCap.value, currentPrice.value
    )
    finalUnits = sizing.notionalUnits
  }
  const r = computeRisk({
    pair: pair.value, accountEquity: accountEquity.value,
    currentPrice: currentPrice.value, leverage: leverage.value,
    notionalUnits: finalUnits, pipSize: pipSize.value,
    reportCurrency: reporting.value
  })
  return { result: r, sizing }
})

const hasError = computed(() => result.value.result.errors.length > 0)
const errorText = computed(() => result.value.result.errors.join(', '))

const fmt = (v: number | null | undefined, d = 2) =>
  number(v ?? 0, { minimumFractionDigits: d, maximumFractionDigits: d })

const fmtMoney = (v: number | null | undefined) => money(v)

const pipsLabel = computed(() => result.value.result.pipSize === 0.01 ? 'pips (¥)' : 'pips')

const baseCurrency = computed(() => pair.value.toUpperCase().slice(0, 3))
const quoteCurrency = computed(() => pair.value.toUpperCase().slice(3, 6))

// Auto-narrow current price when user switches to a yen pair (2-decimal pip)
const presets: Record<string, { price: number }> = {
  EURUSD: { price: 1.10 },
  USDJPY: { price: 155.0 },
  GBPUSD: { price: 1.34 },
  USDCHF: { price: 0.86 },
  AUDUSD: { price: 0.70 },
  USDCAD: { price: 1.40 }
}

watch(pair, (p) => {
  const preset = presets[p.toUpperCase()]
  if (preset) currentPrice.value = preset.price
})
</script>

<template>
  <div class="min-h-screen bg-canvas text-default">
    <DashboardSidebar />
    <DashboardTopBar
      :last-updated="null"
      preferred-name="Risk modeler"
    />

    <main class="min-h-screen lg:ml-64">
      <div class="px-4 py-7 md:px-6 md:py-10 lg:px-10">
        <div class="mx-auto max-w-6xl space-y-8">
          <!-- Header -->
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Leverage risk
            </p>
            <h1 class="font-display mt-2 max-w-2xl text-3xl font-bold tracking-[-0.035em] text-bright md:text-4xl">
              What your leverage really means.
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-soft md:text-base">
              Model the risk of a leveraged FX or futures trade — margin, pip value,
              and how far price can move against you before the broker steps in.
            </p>
          </div>

          <div class="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <!-- Inputs -->
            <UCard :ui="{ root: 'h-fit rounded-[10px] border-subtle bg-surface ring-0', body: 'p-5 md:p-6' }">
              <div class="mb-5 flex items-center gap-2">
                <UIcon
                  name="i-lucide-sliders-horizontal"
                  class="size-4 text-primary"
                />
                <h2 class="text-base font-semibold text-bright">
                  Trade settings
                </h2>
              </div>

              <div class="space-y-5">
                <UFormField
                  label="Currency pair"
                  name="pair"
                  hint="The pair you're trading, e.g. EURUSD."
                >
                  <USelect
                    v-model="pair"
                    :items="['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD']"
                    class="w-full"
                  />
                </UFormField>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField
                    label="Base currency"
                    name="base-currency"
                  >
                    <UInput
                      :model-value="baseCurrency"
                      disabled
                      class="text-center font-semibold"
                    />
                  </UFormField>
                  <UFormField
                    label="Quote currency"
                    name="quote-currency"
                  >
                    <UInput
                      :model-value="quoteCurrency"
                      disabled
                      class="text-center font-semibold"
                    />
                  </UFormField>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField
                    label="Account equity"
                    name="equity"
                    hint="Your total account balance, in the reporting currency."
                  >
                    <UInput
                      v-model="accountEquity"
                      type="number"
                      min="1"
                      placeholder="e.g. 10000"
                    />
                  </UFormField>
                  <UFormField
                    label="Current price"
                    name="price"
                    hint="Spot price of the pair right now. Auto-filled per pair."
                  >
                    <UInput
                      v-model="currentPrice"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="e.g. 1.10"
                    />
                  </UFormField>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField
                    label="Leverage"
                    name="leverage"
                    hint="Broker leverage ratio, e.g. 50 = 50:1. Used to calculate the margin required."
                  >
                    <UInput
                      v-model="leverage"
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                    />
                  </UFormField>
                  <UFormField
                    label="Reporting currency"
                    name="reporting"
                    hint="The currency your account equity and P&L are measured in."
                  >
                    <USelect
                      v-model="reporting"
                      :items="['USD', 'JPY', 'EUR', 'GBP', 'CHF']"
                    />
                  </UFormField>
                </div>

                <UFormField
                  label="Position size"
                  name="units"
                  hint="How much of the base currency you're trading. 100,000 = 1 standard lot, 10,000 = 1 mini lot."
                >
                  <UInput
                    v-model="units"
                    type="number"
                    min="1"
                    class="text-right"
                    placeholder="e.g. 100000"
                  />
                </UFormField>

                <USeparator label="OR size from a risk budget" />

                <div class="flex items-center gap-3">
                  <USwitch v-model="useSizing" />
                  <span class="text-sm text-soft">Size position from my max risk</span>
                </div>

                <div
                  v-if="useSizing"
                  class="grid grid-cols-3 gap-3"
                >
                  <UFormField
                    label="Risk %"
                    hint="Max % of equity to lose if the stop is hit."
                  >
                    <UInput
                      v-model="riskPct"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g. 1"
                    />
                  </UFormField>
                  <UFormField
                    label="Stop (pips)"
                    hint="Distance from entry to your stop-loss, in pips."
                  >
                    <UInput
                      v-model="stopPips"
                      type="number"
                      step="1"
                      min="1"
                      placeholder="e.g. 30"
                    />
                  </UFormField>
                  <UFormField
                    label="Lev. cap (x)"
                    hint="Hard ceiling on this position's leverage."
                  >
                    <UInput
                      v-model="leverageCap"
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                    />
                  </UFormField>
                </div>
              </div>
            </UCard>

            <!-- Results -->
            <div class="space-y-6">
              <UAlert
                v-if="hasError"
                color="error"
                variant="soft"
                icon="i-lucide-triangle-alert"
                title="Check your inputs"
                :description="errorText"
              />

              <UCard
                class="money-summary glow-violet rounded-[10px] border-0 ring-0"
                :ui="{ root: 'rounded-[10px] ring-0', body: 'p-5 md:p-6' }"
              >
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                      {{ result.result.pair }} · {{ result.result.leverage }}x leverage
                    </p>
                    <p class="font-display mt-2 text-3xl font-bold tabular-nums text-white">
                      {{ fmtMoney(result.result.marginRequired) }}
                    </p>
                    <p class="mt-1 text-sm text-white/75">
                      margin required ({{ fmt(result.result.marginPercent, 1) }}% of
                      {{ fmtMoney(result.result.accountEquity) }})
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs font-medium text-white/60">
                      Implied leverage
                    </p>
                    <p class="font-display mt-1 text-3xl font-bold tabular-nums text-white">
                      {{ fmt(result.result.impliedLeverage, 1) }}x
                    </p>
                    <p class="mt-1 text-xs text-white/60">
                      really, not advertised
                    </p>
                  </div>
                </div>
              </UCard>

              <UCard :ui="{ root: 'rounded-[10px] border-subtle bg-surface ring-0', body: 'p-5' }">
                <div class="mb-4 flex items-center gap-2">
                  <UIcon
                    name="i-lucide-gauge"
                    class="size-4 text-primary"
                  />
                  <h3 class="text-sm font-semibold text-bright">
                    Exposure & margin
                  </h3>
                </div>
                <dl class="space-y-3 text-sm">
                  <div class="flex justify-between gap-4">
                    <dt class="text-soft">
                      Position notional
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmtMoney(result.result.notionalValue) }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-subtle pt-3">
                    <dt class="text-soft">
                      Lots (standard)
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmt(result.result.lotsStandard, 2) }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-subtle pt-3">
                    <dt class="text-soft">
                      Pip value
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmtMoney(result.result.pipValueReport) }} / {{ pipsLabel }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-subtle pt-3">
                    <dt class="text-soft">
                      Free margin after
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmtMoney(result.result.freeMarginAfter) }}
                    </dd>
                  </div>
                </dl>
              </UCard>

              <UCard :ui="{ root: 'rounded-[10px] border-subtle bg-surface ring-0', body: 'p-5' }">
                <div class="mb-4 flex items-center gap-2">
                  <UIcon
                    name="i-lucide-alert-triangle"
                    class="size-4 text-warning"
                  />
                  <h3 class="text-sm font-semibold text-bright">
                    Drawdown to stop-out
                  </h3>
                </div>
                <dl class="space-y-3 text-sm">
                  <div class="flex justify-between gap-4">
                    <dt class="text-soft">
                      Adverse move to stop-out
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmt(result.result.drawdownToStopOutPct, 2) }}% ({{ fmt(result.result.stopOutPips, 0) }} {{ pipsLabel }})
                    </dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-subtle pt-3">
                    <dt class="text-soft">
                      Stop-out price
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmt(result.result.stopOutPrice, 5) }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-subtle pt-3">
                    <dt class="text-soft">
                      Margin-call price
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmt(result.result.marginCallPrice, 5) }} ({{ fmt(result.result.marginCallPips, 0) }} {{ pipsLabel }})
                    </dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-subtle pt-3">
                    <dt class="text-soft">
                      Equity protected at stop-out
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmt(result.result.protectedEquityPct, 1) }}%
                    </dd>
                  </div>
                </dl>
                <div class="mt-4 border-l-2 border-primary pl-3">
                  <p class="text-sm leading-relaxed text-default">
                    <template v-if="result.result.stopOutPips > 0">
                      The broker stops you out after a
                      {{ fmt(result.result.stopOutPips, 0) }}-{{ pipsLabel }} adverse move,
                      protecting {{ fmt(result.result.protectedEquityPct, 1) }}% of your equity.
                    </template>
                    <template v-else>
                      This position is at immediate stop-out risk at the current price.
                      Reduce size or leverage.
                    </template>
                  </p>
                </div>
              </UCard>

              <div
                v-if="result.sizing"
                class="rounded-[10px] border border-subtle bg-raised p-5"
              >
                <h3 class="mb-3 text-sm font-semibold text-bright">
                  Sized from risk budget
                </h3>
                <dl class="space-y-3 text-sm">
                  <div class="flex justify-between gap-4">
                    <dt class="text-soft">
                      Risk budget ({{ fmt(riskPct, 1) }}%)
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmtMoney(result.sizing.riskAmount) }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-subtle pt-3">
                    <dt class="text-soft">
                      Position notional
                    </dt>
                    <dd class="font-medium tabular-nums text-bright">
                      {{ fmtMoney(result.result.notionalValue) }}
                    </dd>
                  </div>
                  <div
                    v-if="result.sizing.impliedLeverage != null"
                    class="flex justify-between gap-4 border-t border-subtle pt-3"
                  >
                    <dt class="text-soft">
                      Implied leverage
                    </dt>
                    <dd
                      class="font-medium tabular-nums"
                      :class="result.sizing.exceedsCap ? 'text-warning' : 'text-bright'"
                    >
                      {{ fmt(result.sizing.impliedLeverage, 1) }}x
                      <span
                        v-if="result.sizing.exceedsCap"
                        class="text-xs text-warning"
                      > exceeds cap</span>
                    </dd>
                  </div>
                </dl>
              </div>

              <p class="text-xs leading-relaxed text-faint">
                Educational model only — no trades are placed. Stop-out/margin-call
                thresholds default to 50%/100% of margin used; your broker may differ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
