/**
 * useLeverageRisk — port of the Leveraged FX Risk Modeler (Python) to TS.
 * Quantifies the risk mechanics of leveraged FX / futures trades.
 * Educational only. Values are only as good as your inputs.
 */

export interface RiskInputs {
  pair: string
  accountEquity: number
  currentPrice: number
  leverage: number
  notionalUnits: number
  pipSize?: number | null
  reportCurrency?: string
  stopOutRatio?: number
  marginCallRatio?: number
}

export interface RiskResult {
  pair: string
  quoteCurrency: string
  reportingCurrency: string
  accountEquity: number
  currentPrice: number
  leverage: number
  notionalUnits: number
  pipSize: number
  notionalValue: number // quote currency
  notionalValueReport: number // reporting currency
  marginRequired: number // quote currency
  marginRequiredReport: number // reporting currency
  marginPercent: number // of equity
  freeMarginAfter: number // reporting currency
  impliedLeverage: number
  pipValueQuote: number
  pipValueReport: number
  lotsStandard: number
  stopOutPips: number
  stopOutPrice: number
  drawdownToStopOutPct: number
  protectedEquityPct: number
  marginCallPrice: number
  marginCallPips: number
  maxLeverageSingle: number
  errors: string[]
}

const JPY_LIKE = new Set(['JPY', 'JPX', 'HUF', 'KRW'])
export const LOT_SIZES = { standard: 100_000, mini: 10_000, micro: 1_000, nano: 100 }

export function inferPipSize(quoteCurrency: string, override?: number | null): number {
  if (override != null && override > 0) return override
  return JPY_LIKE.has(quoteCurrency.toUpperCase()) ? 0.01 : 0.0001
}

export function computeRisk(inputs: RiskInputs): RiskResult {
  const errors: string[] = []
  const pair = inputs.pair.toUpperCase()
  const quote = pair.length >= 6 ? pair.slice(3, 6) : 'USD'
  const reporting = (inputs.reportCurrency || 'USD').toUpperCase()
  const pip = inferPipSize(quote, inputs.pipSize)

  const result: RiskResult = {
    pair, quoteCurrency: quote, reportingCurrency: reporting,
    accountEquity: inputs.accountEquity, currentPrice: inputs.currentPrice,
    leverage: inputs.leverage, notionalUnits: inputs.notionalUnits, pipSize: pip,
    notionalValue: 0, notionalValueReport: 0, marginRequired: 0, marginRequiredReport: 0,
    marginPercent: 0, freeMarginAfter: 0,
    impliedLeverage: 0, pipValueQuote: 0, pipValueReport: 0, lotsStandard: 0,
    stopOutPips: 0, stopOutPrice: 0, drawdownToStopOutPct: 0, protectedEquityPct: 0,
    marginCallPrice: 0, marginCallPips: 0, maxLeverageSingle: 0, errors
  }

  if (!(inputs.accountEquity > 0)) errors.push('Account equity must be > 0')
  if (!(inputs.currentPrice > 0)) errors.push('Current price must be > 0')
  if (!(inputs.leverage > 0)) errors.push('Leverage must be > 0')
  if (!(inputs.notionalUnits > 0)) errors.push('Position size must be > 0')
  if (errors.length) return result

  // USD/JPY-style: quote currency value, converted to reporting via price.
  const notionalValue = inputs.notionalUnits * inputs.currentPrice // quote
  const marginRequired = notionalValue / inputs.leverage // quote

  // quote currency -> reporting currency conversion
  // - quote == reporting      : 1:1
  // - otherwise (e.g. JPY quote reported in USD): convert via the price
  const reportPerQuote = quote === reporting ? 1 : 1 / inputs.currentPrice

  const pipValueQuote = pip * inputs.notionalUnits
  const pipValueReport = pipValueQuote * reportPerQuote

  const notionalValueReport = notionalValue * reportPerQuote
  const marginRequiredReport = marginRequired * reportPerQuote

  const stopOutRatio = inputs.stopOutRatio ?? 0.5
  const marginCallRatio = inputs.marginCallRatio ?? 1.0

  result.notionalValue = notionalValue
  result.notionalValueReport = notionalValueReport
  result.marginRequired = marginRequired
  result.marginRequiredReport = marginRequiredReport
  result.pipValueQuote = pipValueQuote
  result.pipValueReport = pipValueReport
  result.lotsStandard = inputs.notionalUnits / LOT_SIZES.standard

  result.marginPercent = (marginRequiredReport / inputs.accountEquity) * 100
  result.freeMarginAfter = Math.max(0, inputs.accountEquity - marginRequiredReport)
  result.impliedLeverage = notionalValueReport / inputs.accountEquity

  const lossAtStopOut = inputs.accountEquity - stopOutRatio * marginRequiredReport
  const safeLoss = Math.max(0, lossAtStopOut)
  result.stopOutPips = pipValueReport > 0 ? Math.max(0, safeLoss / pipValueReport) : 0
  result.stopOutPrice = Math.max(0, inputs.currentPrice - result.stopOutPips * pip)
  result.drawdownToStopOutPct
    = inputs.currentPrice > 0
      ? ((inputs.currentPrice - result.stopOutPrice) / inputs.currentPrice) * 100
      : 0
  result.protectedEquityPct
    = (inputs.accountEquity - safeLoss) / inputs.accountEquity * 100

  const lossAtMC = inputs.accountEquity - marginCallRatio * marginRequiredReport
  const safeMC = Math.max(0, lossAtMC)
  result.marginCallPips = pipValueReport > 0 ? Math.max(0, safeMC / pipValueReport) : 0
  result.marginCallPrice = Math.max(0, inputs.currentPrice - result.marginCallPips * pip)

  if (marginRequiredReport > 0 && stopOutRatio > 0) {
    const safeMargin = inputs.accountEquity * stopOutRatio
    result.maxLeverageSingle = safeMargin > 0 ? notionalValueReport / safeMargin : 0
  }

  return result
}

export interface SizingResult {
  riskAmount: number
  notionalUnits: number
  lotsStandard: number
  impliedLeverage?: number
  requiredMargin?: number
  exceedsCap?: boolean
}

export function sizeForRisk(
  accountEquity: number,
  riskPct: number,
  stopDistancePips: number,
  pipValuePerUnit: number,
  leverageCap?: number,
  currentPrice?: number
): SizingResult {
  const riskAmount = accountEquity * (riskPct / 100)
  const units = riskAmount / (stopDistancePips * pipValuePerUnit)
  const out: SizingResult = {
    riskAmount, notionalUnits: units, lotsStandard: units / LOT_SIZES.standard
  }
  if (leverageCap && currentPrice) {
    const notionalValue = units * currentPrice
    out.requiredMargin = notionalValue / leverageCap
    out.impliedLeverage = notionalValue / accountEquity
    out.exceedsCap = out.impliedLeverage > leverageCap
  }
  return out
}
