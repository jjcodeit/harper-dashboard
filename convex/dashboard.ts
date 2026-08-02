import { query } from './_generated/server'
import { v } from 'convex/values'

// ── Main dashboard query ───────────────────────────────────────

export const dashboard = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const [profileRows, configRows, adapterRows, valuationRows, syncRows] = await Promise.all([
      ctx.db.query('dashboard_profile').order('desc').take(1),
      ctx.db.query('portfolio_config').order('desc').take(1),
      ctx.db.query('market_adapter').order('desc').take(1),
      ctx.db.query('valuation').order('desc').take(1),
      ctx.db.query('sync_metadata').order('desc').take(1)
    ])
    const dashboardProfile = profileRows[0] ?? null
    const dashboardPortfolioConfig = configRows[0] ?? null
    const dashboardMarketAdapter = adapterRows[0] ?? null
    const dashboardValuation = valuationRows[0] ?? null
    const dashboardSyncMetadata = syncRows[0] ?? null

    // State
    const stateRows = await ctx.db.query('state').take(20)
    const stateMap: Record<string, string> = {}
    for (const row of stateRows) {
      stateMap[row.key] = row.value
    }

    // Holdings
    const holdings = await ctx.db.query('holdings').take(100)
    const holdingsCount = holdings.length

    // Preserve the engine's canonical synced valuation. Never substitute cost
    // basis when a sourced market price is unavailable.
    let totalHoldingValue = 0
    let grossExposure = 0
    let netExposure = 0
    const enrichedHoldings = holdings.map((h) => {
      const marketPrice = h.market_price ?? null
      const direction = 'LONG' as const
      const shares = h.shares
      const marketValue = h.market_value ?? 0
      const unrealizedPnl = h.unrealized_pnl ?? 0

      totalHoldingValue += marketValue
      grossExposure += Math.abs(marketValue)
      netExposure += marketValue

      return {
        ticker: h.ticker,
        direction,
        shares,
        signed_shares: h.shares,
        avg_cost_basis: h.avg_cost_basis,
        market_price: marketPrice,
        market_value: marketValue,
        unrealized_pnl: unrealizedPnl,
        trading_currency: h.trading_currency ?? dashboardProfile?.portfolio_currency ?? null,
        trade_style: h.trade_style ?? null,
        quote_source: h.quote_source ?? null,
        quote_asof: h.quote_asof ?? null,
        quote_age_hours: h.quote_age_hours ?? null,
        opened_at: h.opened_at ?? null
      }
    })

    // Cash and NAV
    const cash = parseFloat(stateMap['cash'] ?? '0')
    const initialCash = parseFloat(stateMap['initial_cash'] ?? '0')
    const realizedPnl = parseFloat(stateMap['realized_pnl'] ?? '0')
    const nav = parseFloat(stateMap['nav'] ?? String(cash + totalHoldingValue))
    const totalReturn = nav - initialCash
    const returnPct = initialCash > 0 ? ((nav - initialCash) / initialCash) * 100 : 0

    // Trades (last 20)
    const trades = await ctx.db
      .query('trades')
      .order('desc')
      .take(20)

    // Theses
    const activeTheses = await ctx.db
      .query('theses')
      .withIndex('by_status', q => q.eq('status', 'ACTIVE'))
      .take(100)
    const closedTheses = await ctx.db
      .query('theses')
      .withIndex('by_status', q => q.eq('status', 'CLOSED'))
      .order('desc')
      .take(50)

    // Journal (last 15)
    const journal = await ctx.db
      .query('decision_journal')
      .order('desc')
      .take(15)

    // Latest learning log
    const learningLog = await ctx.db
      .query('learning_log')
      .order('desc')
      .take(1)
    const learning = learningLog.length > 0 ? learningLog[0] : null

    // Market feed (last 20)
    const marketFeed = await ctx.db
      .query('market_feed')
      .order('desc')
      .take(20)

    // Source scores
    const sources = await ctx.db.query('source_scores').take(500)

    // Research library (last 10)
    const research = await ctx.db
      .query('research_library')
      .order('desc')
      .take(10)

    // Snapshots for NAV history
    const navSnapshots = await ctx.db.query('snapshots').order('asc').take(2000)
    const navHistory = navSnapshots.map(s => ({
      t: s.timestamp.slice(0, 10),
      v: Math.round(s.total * 100) / 100
    }))

    // Intel sources
    const intelSources = await ctx.db.query('intel_sources').take(500)
    const intelSourcesCount = intelSources.filter(s => s.enabled === 1).length
    const intelDisabled = intelSources
      .filter(s => s.enabled === 0)
      .map(s => ({ name: s.name, reason_disabled: s.reason_disabled }))

    // Intel articles count
    const intelArticles = await ctx.db.query('intel_articles').take(500)
    const totalDups = intelSources.reduce((s, src) => s + (src.duplicate_count ?? 0), 0)
    const totalTickers = intelSources.reduce((s, src) => s + (src.ticker_mentions ?? 0), 0)

    const combinedFeed = [
      ...marketFeed.map(item => ({
        source_type: item.source_type,
        observation: item.observation,
        source_urls: item.source_urls,
        created_at: item.created_at
      })),
      ...intelArticles.map(article => ({
        source_type: 'intel_article',
        observation: article.summary ? `${article.title}. ${article.summary}` : article.title,
        source_urls: article.link,
        created_at: article.created_at
      }))
    ]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 20)

    const lifecycleRows = await ctx.db.query('data_lifecycle').order('desc').take(1)
    const dataLifecycle = lifecycleRows[0] ?? null
    const llmUsage = await ctx.db
      .query('llm_usage')
      .withIndex('by_started_at')
      .order('desc')
      .take(2000)
    const decisions = await ctx.db
      .query('decisions')
      .withIndex('by_timestamp')
      .order('desc')
      .take(100)
    const candidateEvaluations = await ctx.db.query('candidate_evaluations').take(1000)
    const candidateOutcomes = await ctx.db.query('candidate_outcomes').take(2000)
    const opportunityAudits = await ctx.db
      .query('opportunity_audits')
      .withIndex('by_generated_at')
      .order('desc')
      .take(20)

    const sortedCandidates = [...candidateEvaluations]
      .sort((a, b) => b.evaluated_at.localeCompare(a.evaluated_at))
    const latestCandidateMap = new Map<string, (typeof candidateEvaluations)[number]>()
    for (const candidate of sortedCandidates) {
      if (!latestCandidateMap.has(candidate.ticker)) {
        latestCandidateMap.set(candidate.ticker, candidate)
      }
    }
    const latestCandidates = [...latestCandidateMap.values()]
    const deepCandidates = latestCandidates.filter(candidate => candidate.research_depth === 'DEEP')
    const documentedDeepCandidates = deepCandidates.filter(candidate =>
      candidate.status === 'APPROVED'
      || (candidate.status === 'REJECTED' && candidate.binding_rejection_gate)
    )
    const rejectedCandidates = latestCandidates.filter(candidate => candidate.status === 'REJECTED')
    const rejectionGateCounts: Record<string, number> = {}
    for (const candidate of rejectedCandidates) {
      if (!candidate.binding_rejection_gate) continue
      rejectionGateCounts[candidate.binding_rejection_gate]
        = (rejectionGateCounts[candidate.binding_rejection_gate] ?? 0) + 1
    }
    const topRejectionGate = Object.entries(rejectionGateCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const isGateFailure = (value: unknown) =>
      ['FAIL', 'FAILED', 'REJECT', 'REJECTED', 'BLOCKED', 'FALSE', '0']
        .includes(String(value).trim().toUpperCase())
    const nearMisses = rejectedCandidates
      .filter((candidate) => {
        try {
          const gates = JSON.parse(candidate.gate_outcomes_json) as Record<string, unknown>
          return Object.values(gates).filter(isGateFailure).length === 1
        } catch {
          return false
        }
      })
      .sort((a, b) => b.preliminary_score - a.preliminary_score)
      .slice(0, 10)

    const forwardOutperformance = [5, 10, 20].map((horizon) => {
      const marked = candidateOutcomes.filter(
        outcome => outcome.horizon_sessions === horizon && outcome.active_return_pct != null
      )
      const outperformed = marked.filter(outcome => (outcome.active_return_pct ?? 0) > 0).length
      return {
        horizon_sessions: horizon,
        marked: marked.length,
        outperformed,
        outperformed_pct: marked.length ? Math.round(outperformed / marked.length * 10000) / 100 : null,
        average_active_return_pct: marked.length
          ? Math.round(marked.reduce((sum, outcome) => sum + (outcome.active_return_pct ?? 0), 0)
            / marked.length * 10000) / 10000
          : null
      }
    })
    const shadowTransitions: Record<string, number> = {}
    for (const candidate of latestCandidates) {
      const legacy = candidate.legacy_result ?? candidate.status
      const shadow = candidate.shadow_recommendation ?? 'UNSCORED'
      const key = `${legacy}->${shadow}`
      shadowTransitions[key] = (shadowTransitions[key] ?? 0) + 1
    }
    const shadowApproved = latestCandidates.filter(
      candidate => candidate.shadow_recommendation === 'APPROVED'
    ).length
    const hardGatePassed = latestCandidates.filter(candidate => candidate.hard_gate_pass === 1).length
    const latestOpportunityAudit = opportunityAudits[0] ?? null

    // Intel source stats
    const intelSourceStats = intelSources.map(s => ({
      id: s._id,
      name: s.name,
      feed_url: s.feed_url,
      source_type: s.source_type,
      total_fetched: s.total_fetched ?? 0,
      unique_count: s.unique_count ?? 0,
      duplicate_count: s.duplicate_count ?? 0,
      ticker_mentions: s.ticker_mentions ?? 0,
      dup_pct: ((s.duplicate_count ?? 0) / Math.max(s.total_fetched ?? 1, 1)) * 100,
      last_fetch_at: s.last_fetch_at ?? null,
      enabled: s.enabled,
      reason_disabled: s.reason_disabled ?? null,
      relevance_pass_rate: s.relevance_pass_rate ?? 0,
      relevance_checked: s.relevance_checked ?? 0,
      llm_rescued_count: s.llm_rescued_count ?? 0
    }))

    // Runs (last 10)
    const runs = await ctx.db
      .query('runs')
      .order('desc')
      .take(10)

    // Latest journal thoughts
    const latestThoughts = journal.slice(0, 3).map(j => j.content)

    // Market context follows the configured benchmark instead of a country-specific pair.
    const benchmarkTicker = dashboardPortfolioConfig?.benchmark_ticker
    const benchmarkData = benchmarkTicker
      ? await ctx.db
          .query('historical_prices')
          .withIndex('by_ticker_date', q => q.eq('ticker', benchmarkTicker))
          .take(260)
      : []

    const mkts: Record<string, {
      latest: number
      low5: number
      high5: number
      pct: number
      last_date: string
    }> = {}
    if (benchmarkTicker && benchmarkData.length > 0) {
      benchmarkData.sort((a, b) => a.date.localeCompare(b.date))
      const closes = benchmarkData.map(row => row.close)
      const latest = closes.at(-1)
      const latestRow = benchmarkData.at(-1)
      if (latest != null && latestRow) {
        const low5 = Math.min(...closes)
        const high5 = Math.max(...closes)
        const pct = high5 !== low5 ? ((latest - low5) / (high5 - low5)) * 100 : 50
        mkts[dashboardPortfolioConfig?.benchmark_name ?? benchmarkTicker] = {
          latest: Math.round(latest * 100) / 100,
          low5: Math.round(low5 * 100) / 100,
          high5: Math.round(high5 * 100) / 100,
          pct: Math.round(pct * 10) / 10,
          last_date: latestRow.date
        }
      }
    }

    // Latest run
    const latestRun = runs.length > 0 ? runs[0] : null

    return {
      profile: dashboardProfile,
      portfolio_config: dashboardPortfolioConfig,
      market_adapter: dashboardMarketAdapter
        ? {
            ...dashboardMarketAdapter,
            session_schedule: JSON.parse(dashboardMarketAdapter.session_schedule_json),
            cost_model: JSON.parse(dashboardMarketAdapter.cost_model_json),
            capabilities: JSON.parse(dashboardMarketAdapter.capabilities_json),
            sources: JSON.parse(dashboardMarketAdapter.sources_json),
            market_session: JSON.parse(dashboardMarketAdapter.market_session_json)
          }
        : null,
      valuation: dashboardValuation,
      sync_metadata: dashboardSyncMetadata,
      status: {
        reporting_currency: dashboardProfile?.portfolio_currency ?? 'CUR',
        cash,
        initial_cash: initialCash,
        holdings: enrichedHoldings,
        holdings_count: holdingsCount,
        market_value: totalHoldingValue,
        nav,
        realized_pnl: realizedPnl,
        gross_exposure_pct: nav > 0 ? Math.round((grossExposure / nav) * 10000) / 100 : 0,
        net_exposure_pct: nav > 0 ? Math.round((netExposure / nav) * 10000) / 100 : 0,
        return: Math.round(totalReturn * 100) / 100,
        return_pct: Math.round(returnPct * 100) / 100,
        valuation_status: dashboardValuation?.status ?? 'UNAVAILABLE',
        stale_tickers: dashboardValuation?.stale_tickers ?? [],
        portfolio_heat_pct: dashboardValuation?.portfolio_heat_pct ?? 0,
        risk_data_missing: dashboardValuation?.risk_data_missing ?? [],
        gross_realized_pnl: dashboardValuation?.gross_realized_pnl ?? 0,
        trading_costs: dashboardValuation?.trading_costs ?? 0,
        recent_journal: journal,
        latest_run: latestRun
          ? {
              id: latestRun._id,
              market_date: latestRun.market_date,
              status: latestRun.status,
              report: latestRun.report,
              created_at: latestRun.created_at,
              completed_at: latestRun.completed_at,
              decision_model_version: latestRun.decision_model_version,
              parameter_version: latestRun.parameter_version,
              schedule_version: latestRun.schedule_version
            }
          : null
      },
      nav_history: navHistory,
      theses_active: activeTheses.map(t => ({
        ticker: t.ticker,
        direction: t.direction,
        confidence: t.confidence,
        horizon: t.horizon,
        target: t.target,
        catalyst: t.catalyst,
        invalidation: t.invalidation,
        variant_view: t.variant_view,
        sources_json: t.sources_json,
        created_at: t.created_at,
        investment_success_probability: t.investment_success_probability,
        ev_model: t.ev_model,
        scenario_json: t.scenario_json,
        expected_return_pct: t.expected_return_pct,
        thesis_type: t.thesis_type,
        thesis_contract_json: t.thesis_contract_json,
        review_date: t.review_date
      })),
      theses_closed: closedTheses.map(t => ({
        ticker: t.ticker,
        direction: t.direction,
        confidence: t.confidence,
        outcome: t.outcome,
        lesson: t.lesson,
        exit_reason: t.exit_reason,
        timing_accuracy: t.timing_accuracy,
        was_calibrated: t.was_calibrated,
        closed_at: t.closed_at
      })),
      trades: trades.map(t => ({
        ticker: t.ticker,
        action: t.action,
        shares: t.shares,
        price: t.price,
        total: t.total,
        reason: t.reason,
        timestamp: t.timestamp
      })),
      feed: combinedFeed,
      sources: sources.map(s => ({
        domain: s.domain,
        wins: s.wins,
        losses: s.losses,
        flats: s.flats,
        ratio:
          s.wins + s.losses > 0
            ? Math.round((s.wins / (s.wins + s.losses)) * 1000) / 1000
            : 0
      })),
      learning: learning
        ? {
            win_rate_pct: learning.win_rate_pct,
            brier_score: learning.brier_score,
            calibration_drift: learning.calibration_drift,
            lessons: learning.lessons,
            created_at: learning.created_at
          }
        : null,
      journal: journal.map(j => ({
        entry_type: j.entry_type,
        content: j.content,
        timestamp: j.timestamp
      })),
      research: research.map(r => ({
        ticker: r.ticker,
        sector: r.sector,
        topic: r.topic,
        findings: r.findings,
        sources_json: r.sources_json,
        created_at: r.created_at
      })),
      markets: mkts,
      intel_sources_count: intelSourcesCount,
      intel_disabled: intelDisabled,
      intel_articles_stats: {
        total: dataLifecycle?.hot_intel_articles ?? intelArticles.length,
        dups: totalDups,
        tickers: totalTickers
      },
      intel_source_stats: intelSourceStats,
      data_lifecycle: dataLifecycle
        ? {
            policy_version: dataLifecycle.policy_version,
            hot_intel_articles: dataLifecycle.hot_intel_articles,
            hot_market_feed: dataLifecycle.hot_market_feed,
            hot_research: dataLifecycle.hot_research,
            hot_quotes: dataLifecycle.hot_quotes,
            hot_historical_prices: dataLifecycle.hot_historical_prices,
            archived_rows: dataLifecycle.archived_rows,
            last_archived_rows: dataLifecycle.last_archived_rows,
            last_purged_rows: dataLifecycle.last_purged_rows,
            last_maintained_at: dataLifecycle.last_maintained_at
          }
        : null,
      llm_usage: llmUsage.map(usage => ({
        id: usage._id,
        usage_key: usage.usage_key,
        session_id: usage.session_id,
        root_session_id: usage.root_session_id,
        job_id: usage.job_id,
        job_name: usage.job_name,
        source: usage.source,
        model: usage.model,
        provider: usage.provider,
        task: usage.task,
        started_at: usage.started_at,
        ended_at: usage.ended_at,
        api_calls: usage.api_calls,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_read_tokens: usage.cache_read_tokens,
        cache_write_tokens: usage.cache_write_tokens,
        reasoning_tokens: usage.reasoning_tokens,
        estimated_cost_usd: usage.estimated_cost_usd,
        actual_cost_usd: usage.actual_cost_usd,
        cost_status: usage.cost_status
      })),
      runs: runs.map(r => ({
        id: r._id,
        market_date: r.market_date,
        session_label: r.session_label,
        status: r.status,
        report: r.report,
        created_at: r.created_at,
        completed_at: r.completed_at,
        decision_model_version: r.decision_model_version,
        parameter_version: r.parameter_version,
        schedule_version: r.schedule_version
      })),
      latest_thoughts: latestThoughts,
      decisions: decisions.map(decision => ({
        id: decision.local_id,
        run_id: decision.run_id,
        action: decision.action,
        ticker: decision.ticker,
        rationale: decision.rationale,
        evidence_json: decision.evidence_json,
        cash_reason: decision.cash_reason,
        timestamp: decision.timestamp,
        decision_model_version: decision.decision_model_version,
        parameter_version: decision.parameter_version
      })),
      opportunity: {
        funnel: {
          screened: latestCandidates.length,
          ranked: latestCandidates.filter(candidate =>
            candidate.research_depth === 'RANKED' || candidate.research_depth === 'DEEP'
          ).length,
          deep: deepCandidates.length,
          approved: latestCandidates.filter(candidate => candidate.status === 'APPROVED').length,
          rejected: rejectedCandidates.length,
          deep_documentation_pct: deepCandidates.length
            ? Math.round(documentedDeepCandidates.length / deepCandidates.length * 10000) / 100
            : null
        },
        shadow_model: {
          mode: 'SHADOW_ONLY',
          model_version: latestCandidates.find(candidate => candidate.scoring_model_version)
            ?.scoring_model_version ?? '2.0-shadow',
          score_threshold: 70,
          hard_gate_passed: hardGatePassed,
          shadow_approved: shadowApproved,
          transitions: shadowTransitions
        },
        most_common_rejection_gate: topRejectionGate,
        rejections_by_gate: rejectionGateCounts,
        near_misses: nearMisses.map(candidate => ({
          evaluation_id: candidate.evaluation_id,
          ticker: candidate.ticker,
          score: candidate.weighted_score ?? candidate.preliminary_score,
          thesis_type: candidate.thesis_type,
          binding_gate: candidate.binding_rejection_gate,
          evaluated_at: candidate.evaluated_at
        })),
        forward_outperformance: forwardOutperformance,
        latest_audit: latestOpportunityAudit
          ? {
              triggered: latestOpportunityAudit.triggered === 1,
              sessions_required: latestOpportunityAudit.sessions_required,
              sessions_observed: latestOpportunityAudit.sessions_observed,
              low_exposure_sessions: latestOpportunityAudit.low_exposure_sessions,
              exposure_threshold_pct: latestOpportunityAudit.exposure_threshold_pct,
              average_exposure_pct: latestOpportunityAudit.average_exposure_pct,
              screened_candidates: latestOpportunityAudit.screened_candidates,
              ranked_candidates: latestOpportunityAudit.ranked_candidates,
              deep_candidates: latestOpportunityAudit.deep_candidates,
              approved_candidates: latestOpportunityAudit.approved_candidates,
              rejected_candidates: latestOpportunityAudit.rejected_candidates,
              top_rejection_gate: latestOpportunityAudit.top_rejection_gate,
              diagnostics: JSON.parse(latestOpportunityAudit.diagnostics_json) as string[],
              window_start: latestOpportunityAudit.window_start,
              window_end: latestOpportunityAudit.window_end,
              generated_at: latestOpportunityAudit.generated_at
            }
          : null,
        candidates: latestCandidates.slice(0, 50).map(candidate => ({
          evaluation_id: candidate.evaluation_id,
          ticker: candidate.ticker,
          thesis_type: candidate.thesis_type,
          research_depth: candidate.research_depth,
          status: candidate.status,
          preliminary_score: candidate.preliminary_score,
          rank: candidate.rank,
          binding_rejection_gate: candidate.binding_rejection_gate,
          hard_gates_json: candidate.hard_gates_json,
          hard_gate_pass: candidate.hard_gate_pass,
          score_components_json: candidate.score_components_json,
          weighted_score: candidate.weighted_score,
          scoring_model_version: candidate.scoring_model_version,
          legacy_result: candidate.legacy_result,
          shadow_recommendation: candidate.shadow_recommendation,
          evaluated_at: candidate.evaluated_at
        }))
      },
      operating_schedule: {
        version: latestRun?.schedule_version ?? '2026.1',
        timezone: dashboardMarketAdapter?.market_timezone ?? null,
        sessions: dashboardMarketAdapter
          ? (JSON.parse(dashboardMarketAdapter.session_schedule_json).sessions ?? [])
          : []
      },
      quotes_count: (await ctx.db.query('quotes').take(2000)).length,
      historical_prices_count: benchmarkData.length,
      intel_articles_count: intelArticles.length,
      source_scores_count: sources.length
    }
  }
})
