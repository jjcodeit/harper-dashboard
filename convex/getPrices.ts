import { action } from './_generated/server'
import { v } from 'convex/values'

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number
        chartPreviousClose?: number
      }
    }>
  }
}

/**
 * Fetches live stock prices from Yahoo Finance for the given tickers.
 * Called client-side by the Nuxt dashboard every 60 seconds.
 */
export const getLivePrices = action({
  args: {
    tickers: v.array(v.string())
  },
  returns: v.record(
    v.string(),
    v.union(
      v.object({
        price: v.number(),
        change: v.number(),
        changePercent: v.number(),
        asof: v.string()
      }),
      v.null()
    )
  ),
  handler: async (_ctx, args) => {
    if (args.tickers.length > 25) {
      throw new Error('A maximum of 25 tickers can be refreshed at once')
    }
    const results: Record<string, {
      price: number
      change: number
      changePercent: number
      asof: string
    } | null> = {}

    for (const ticker of args.tickers) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        if (!resp.ok) {
          results[ticker] = null
          continue
        }
        const data = await resp.json() as YahooChartResponse
        const meta = data?.chart?.result?.[0]?.meta
        if (meta?.regularMarketPrice != null) {
          const close = meta.chartPreviousClose ?? meta.regularMarketPrice
          results[ticker] = {
            price: meta.regularMarketPrice,
            change: meta.regularMarketPrice - close,
            changePercent: close ? ((meta.regularMarketPrice - close) / close) * 100 : 0,
            asof: new Date().toISOString()
          }
        } else {
          results[ticker] = null
        }
      } catch {
        results[ticker] = null
      }
    }

    return results
  }
})
