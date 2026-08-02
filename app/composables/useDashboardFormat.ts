type DashboardFormatConfig = {
  locale?: string | null
  userTimezone?: string | null
  portfolioCurrency?: string | null
}

const validCurrency = (value: string | null | undefined) =>
  /^[A-Z]{3}$/.test(value ?? '') ? value! : 'USD'

export function useDashboardFormat() {
  const localeCookie = useCookie<string>('harper-locale', { default: () => 'en-US' })
  const timezoneCookie = useCookie<string>('harper-timezone', { default: () => '' })
  const portfolioCurrency = useState('harper-portfolio-currency', () => 'USD')
  const profileTimezone = useState('harper-profile-timezone', () => 'UTC')

  const locale = computed({
    get: () => localeCookie.value || 'en-US',
    set: (value) => {
      localeCookie.value = value || 'en-US'
    }
  })
  const timezone = computed({
    get: () => timezoneCookie.value || profileTimezone.value || 'UTC',
    set: (value) => {
      timezoneCookie.value = value || profileTimezone.value || 'UTC'
    }
  })

  const configure = (config: DashboardFormatConfig) => {
    portfolioCurrency.value = validCurrency(config.portfolioCurrency)
    profileTimezone.value = config.userTimezone || 'UTC'
    if (config.locale && !localeCookie.value) localeCookie.value = config.locale
  }

  const number = (
    value: number | null | undefined,
    options: Intl.NumberFormatOptions = {}
  ) => value == null
    ? '—'
    : new Intl.NumberFormat(locale.value, options).format(value)

  const money = (
    value: number | null | undefined,
    currency = portfolioCurrency.value,
    options: Intl.NumberFormatOptions = {}
  ) => value == null
    ? '—'
    : new Intl.NumberFormat(locale.value, {
        style: 'currency',
        currency: validCurrency(currency),
        currencyDisplay: 'narrowSymbol',
        ...options
      }).format(value)

  const signedMoney = (
    value: number | null | undefined,
    currency = portfolioCurrency.value
  ) => {
    if (value == null) return '—'
    const normalized = Math.abs(value) < 0.005 ? 0 : value
    const formatted = money(Math.abs(normalized), currency)
    return normalized === 0 ? formatted : `${normalized > 0 ? '+' : '−'}${formatted}`
  }

  const percent = (value: number | null | undefined, signed = false) => {
    if (value == null) return '—'
    const normalized = Math.abs(value) < 0.005 ? 0 : value
    const formatted = number(Math.abs(normalized), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    if (!signed || normalized === 0) return `${formatted}%`
    return `${normalized > 0 ? '+' : '−'}${formatted}%`
  }

  const dateTime = (
    value: string | number | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {}
  ) => {
    if (value == null || value === '') return '—'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone.value,
      ...options
    }).format(date)
  }

  const date = (value: string | number | Date | null | undefined) => {
    if (value == null || value === '') return '—'
    const parsed = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeZone: timezone.value
    }).format(parsed)
  }

  return {
    locale,
    timezone,
    portfolioCurrency: readonly(portfolioCurrency),
    profileTimezone: readonly(profileTimezone),
    configure,
    number,
    money,
    signedMoney,
    percent,
    date,
    dateTime
  }
}
