import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Full dashboard sync — replaces all dashboard data in one shot.
 * Called by the Hermes cron job via Convex HTTP API after each trading run.
 */
export const syncDashboard = internalMutation({
  args: {
    profile: v.object({
      preferred_name: v.optional(v.string()),
      user_timezone: v.string(),
      portfolio_currency: v.string(),
      initial_capital: v.number()
    }),
    portfolio_config: v.object({
      market_id: v.string(),
      market_label: v.string(),
      portfolio_currency: v.string(),
      benchmark_ticker: v.optional(v.string()),
      benchmark_name: v.optional(v.string()),
      benchmark_mode: v.string(),
      cost_mode: v.string()
    }),
    market_adapter: v.object({
      market_id: v.string(),
      display_name: v.string(),
      status: v.union(v.literal('DISCOVERY'), v.literal('LIMITED'), v.literal('OPERATIONAL')),
      version: v.number(),
      market_timezone: v.optional(v.string()),
      native_currency: v.optional(v.string()),
      benchmark_ticker: v.optional(v.string()),
      session_schedule_json: v.string(),
      cost_model_json: v.string(),
      capabilities_json: v.string(),
      sources_json: v.string(),
      market_session_json: v.string(),
      last_validated_at: v.optional(v.string()),
      updated_at: v.optional(v.string())
    }),
    valuation: v.object({
      valued_at: v.string(),
      status: v.union(v.literal('FRESH'), v.literal('STALE'), v.literal('UNAVAILABLE')),
      portfolio_currency: v.string(),
      stale_tickers: v.array(v.string()),
      gross_realized_pnl: v.number(),
      trading_costs: v.number(),
      portfolio_heat_pct: v.number(),
      risk_data_missing: v.array(v.string())
    }),
    sync_metadata: v.object({
      source_updated_at: v.string(),
      synced_at: v.string(),
      complete: v.boolean()
    }),
    status: v.object({
      reporting_currency: v.string(),
      cash: v.number(),
      initial_cash: v.number(),
      holdings: v.array(v.object({
        ticker: v.string(),
        direction: v.literal('LONG'),
        shares: v.number(),
        signed_shares: v.number(),
        avg_cost_basis: v.number(),
        market_price: v.number(),
        market_value: v.number(),
        unrealized_pnl: v.number(),
        quote_source: v.optional(v.string()),
        quote_asof: v.optional(v.string()),
        quote_age_hours: v.optional(v.number()),
        trade_style: v.optional(v.union(v.literal('INTRADAY'), v.literal('POSITION'))),
        opened_at: v.optional(v.string())
      })),
      holdings_count: v.number(),
      market_value: v.number(),
      nav: v.number(),
      realized_pnl: v.number(),
      gross_exposure_pct: v.number(),
      net_exposure_pct: v.number(),
      return: v.number(),
      return_pct: v.number(),
      valuation_status: v.union(v.literal('FRESH'), v.literal('STALE'), v.literal('UNAVAILABLE')),
      stale_tickers: v.array(v.string()),
      portfolio_heat_pct: v.number(),
      risk_data_missing: v.array(v.string()),
      gross_realized_pnl: v.number(),
      trading_costs: v.number(),
      exposure_regime: v.optional(v.object({
        name: v.string(), min_exposure_pct: v.number(), max_exposure_pct: v.number(),
        current_exposure_pct: v.number(), within_band: v.boolean(), below_band: v.boolean(),
        above_band: v.boolean(), reason: v.string(), updated_at: v.string()
      })),
      latest_cash_reason: v.optional(v.object({
        cash_reason: v.optional(v.string()), rationale: v.string(), timestamp: v.string()
      })),
      latest_run: v.optional(v.object({
        id: v.any(),
        market_date: v.string(),
        session_label: v.optional(v.string()),
        status: v.string(),
        report: v.optional(v.string()),
        created_at: v.string(),
        completed_at: v.optional(v.string())
      }))
    }),
    nav_history: v.array(v.object({
      t: v.string(),
      v: v.number(),
      cash: v.number(),
      holdings_value: v.number(),
      benchmark_price: v.optional(v.number())
    })),
    theses_active: v.array(v.object({
      ticker: v.string(),
      direction: v.literal('LONG'),
      confidence: v.number(),
      horizon: v.string(),
      target: v.number(),
      catalyst: v.string(),
      invalidation: v.string(),
      variant_view: v.string(),
      sources_json: v.string(),
      created_at: v.string(),
      investment_success_probability: v.optional(v.number()),
      ev_model: v.optional(v.string()),
      scenario_json: v.optional(v.string()),
      expected_return_pct: v.optional(v.number()),
      thesis_type: v.optional(v.union(v.literal('CATALYST'), v.literal('QUALITY'), v.literal('VALUE'), v.literal('MOMENTUM'))),
      thesis_contract_json: v.optional(v.string()),
      review_date: v.optional(v.string())
    })),
    theses_closed: v.array(v.object({
      ticker: v.string(),
      direction: v.literal('LONG'),
      confidence: v.optional(v.number()),
      outcome: v.optional(v.string()),
      lesson: v.optional(v.string()),
      exit_reason: v.optional(v.string()),
      timing_accuracy: v.optional(v.string()),
      was_calibrated: v.optional(v.number()),
      closed_at: v.optional(v.string())
    })),
    trades: v.array(v.object({
      ticker: v.string(),
      action: v.union(v.literal('BUY'), v.literal('SELL')),
      shares: v.number(),
      price: v.number(),
      total: v.number(),
      reason: v.string(),
      timestamp: v.string()
    })),
    feed: v.array(v.object({
      source_type: v.string(),
      observation: v.string(),
      source_urls: v.string(),
      created_at: v.string()
    })),
    learning: v.optional(v.object({
      win_rate_pct: v.optional(v.union(v.float64(), v.null())),
      brier_score: v.optional(v.union(v.float64(), v.null())),
      calibration_drift: v.optional(v.union(v.float64(), v.null())),
      lessons: v.optional(v.union(v.string(), v.null())),
      created_at: v.string()
    })),
    journal: v.array(v.object({
      entry_type: v.string(),
      content: v.string(),
      timestamp: v.string()
    })),
    research: v.array(v.object({
      ticker: v.string(),
      sector: v.optional(v.string()),
      topic: v.string(),
      findings: v.string(),
      sources_json: v.string(),
      created_at: v.string()
    })),
    markets: v.any(),
    intel_sources_count: v.number(),
    intel_disabled: v.array(v.object({
      name: v.string(),
      reason_disabled: v.optional(v.string())
    })),
    intel_articles_stats: v.union(v.object({
      total: v.number(),
      dups: v.number(),
      tickers: v.number()
    }), v.null()),
    intel_source_stats: v.array(v.object({
      id: v.any(),
      name: v.string(),
      feed_url: v.string(),
      source_type: v.string(),
      total_fetched: v.number(),
      unique_count: v.number(),
      duplicate_count: v.number(),
      ticker_mentions: v.number(),
      dup_pct: v.number(),
      last_fetch_at: v.optional(v.string()),
      enabled: v.number(),
      reason_disabled: v.optional(v.union(v.string(), v.null())),
      relevance_pass_rate: v.optional(v.number()),
      relevance_checked: v.optional(v.number()),
      llm_rescued_count: v.optional(v.number())
    })),
    runs: v.array(v.object({
      id: v.any(),
      market_date: v.string(),
      session_label: v.optional(v.string()),
      status: v.string(),
      report: v.optional(v.string()),
      created_at: v.string(),
      completed_at: v.optional(v.string()),
      decision_model_version: v.optional(v.string()),
      parameter_version: v.optional(v.string()),
      schedule_version: v.optional(v.string())
    })),
    latest_thoughts: v.array(v.string()),

    // Quotes
    quotes: v.array(v.object({
      ticker: v.string(),
      price: v.number(),
      source: v.string(),
      asof: v.string(),
      recorded_at: v.string()
    })),

    // Historical prices (last 30 rows per ticker)
    historical_prices: v.array(v.object({
      ticker: v.string(),
      date: v.string(),
      open: v.optional(v.number()),
      high: v.optional(v.number()),
      low: v.optional(v.number()),
      close: v.number(),
      volume: v.optional(v.number())
    })),

    // Intel articles (last 50)
    intel_articles: v.array(v.object({
      source_id: v.number(),
      fingerprint: v.string(),
      title: v.string(),
      link: v.string(),
      summary: v.optional(v.string()),
      source_domain: v.optional(v.string()),
      tickers: v.optional(v.string()),
      created_at: v.string()
    })),

    // Source scores (include zero-score rows so table isn't empty)
    source_scores: v.array(v.object({
      domain: v.string(),
      wins: v.number(),
      losses: v.number(),
      flats: v.number(),
      last_updated: v.string()
    })),
    data_lifecycle: v.object({
      policy_version: v.number(),
      hot_intel_articles: v.number(),
      hot_market_feed: v.number(),
      hot_research: v.number(),
      hot_quotes: v.number(),
      hot_historical_prices: v.number(),
      archived_rows: v.number(),
      last_archived_rows: v.number(),
      last_purged_rows: v.number(),
      last_maintained_at: v.optional(v.string())
    }),
    llm_usage: v.array(v.object({
      usage_key: v.string(),
      session_id: v.string(),
      root_session_id: v.string(),
      job_id: v.optional(v.string()),
      job_name: v.string(),
      source: v.string(),
      model: v.string(),
      provider: v.string(),
      task: v.optional(v.string()),
      started_at: v.string(),
      ended_at: v.optional(v.string()),
      api_calls: v.number(),
      input_tokens: v.number(),
      output_tokens: v.number(),
      cache_read_tokens: v.number(),
      cache_write_tokens: v.number(),
      reasoning_tokens: v.number(),
      estimated_cost_usd: v.number(),
      actual_cost_usd: v.number(),
      cost_status: v.string()
    })),
    decisions: v.array(v.object({
      id: v.number(),
      run_id: v.optional(v.number()),
      action: v.union(
        v.literal('NO_TRADE'),
        v.literal('OPEN'),
        v.literal('ADD'),
        v.literal('REDUCE'),
        v.literal('CLOSE'),
        v.literal('INVALIDATE')
      ),
      ticker: v.optional(v.string()),
      rationale: v.string(),
      evidence_json: v.string(),
      cash_reason: v.optional(v.string()),
      decision_model_version: v.optional(v.string()),
      parameter_version: v.optional(v.string()),
      timestamp: v.string()
    })),
    candidate_evaluations: v.array(v.object({
      id: v.number(),
      run_id: v.optional(v.number()),
      ticker: v.string(),
      thesis_type: v.union(
        v.literal('CATALYST'),
        v.literal('QUALITY'),
        v.literal('VALUE'),
        v.literal('MOMENTUM')
      ),
      research_depth: v.union(
        v.literal('SCREENED'),
        v.literal('RANKED'),
        v.literal('DEEP')
      ),
      status: v.union(
        v.literal('WATCHLIST'),
        v.literal('REJECTED'),
        v.literal('APPROVED')
      ),
      preliminary_score: v.number(),
      rank: v.optional(v.number()),
      quote_price: v.number(),
      quote_source: v.string(),
      quote_asof: v.string(),
      benchmark_price: v.optional(v.number()),
      benchmark_source: v.optional(v.string()),
      benchmark_asof: v.optional(v.string()),
      binding_rejection_gate: v.optional(v.string()),
      gate_outcomes_json: v.string(),
      sources_json: v.string(),
      snapshot_json: v.string(),
      evaluated_at: v.string(),
      hard_gates_json: v.string(),
      hard_gate_pass: v.number(),
      score_components_json: v.string(),
      weighted_score: v.optional(v.number()),
      scoring_model_version: v.optional(v.string()),
      legacy_result: v.optional(v.string()),
      shadow_recommendation: v.optional(v.string())
    })),
    candidate_outcomes: v.array(v.object({
      evaluation_id: v.number(),
      horizon_sessions: v.union(v.literal(5), v.literal(10), v.literal(20)),
      outcome_date: v.string(),
      candidate_price: v.number(),
      benchmark_price: v.optional(v.number()),
      candidate_return_pct: v.number(),
      benchmark_return_pct: v.optional(v.number()),
      active_return_pct: v.optional(v.number()),
      marked_at: v.string()
    })),
    opportunity_audits: v.array(v.object({
      triggered: v.number(),
      sessions_required: v.number(),
      sessions_observed: v.number(),
      low_exposure_sessions: v.number(),
      exposure_threshold_pct: v.number(),
      average_exposure_pct: v.optional(v.number()),
      screened_candidates: v.number(),
      ranked_candidates: v.number(),
      deep_candidates: v.number(),
      approved_candidates: v.number(),
      rejected_candidates: v.number(),
      top_rejection_gate: v.optional(v.string()),
      diagnostics_json: v.string(),
      window_start: v.optional(v.string()),
      window_end: v.optional(v.string()),
      generated_at: v.string()
    }))
  },
  returns: v.object({
    synced: v.literal(true),
    at: v.string(),
    contractVersion: v.literal(2)
  }),
  handler: async (ctx, args) => {
    // Helper to replace all rows in a table
    const clearTable = async (tableName: string) => {
      const docs = await ctx.db
        .query(tableName as Parameters<typeof ctx.db.query>[0])
        .take(2001)
      if (docs.length > 2000) {
        throw new Error(`Refusing to replace ${tableName}: table exceeds the 2,000-row safety limit`)
      }
      for (const doc of docs) {
        await ctx.db.delete(doc._id)
      }
    }

    await clearTable('dashboard_profile')
    await ctx.db.insert('dashboard_profile', args.profile)
    await clearTable('portfolio_config')
    await ctx.db.insert('portfolio_config', args.portfolio_config)
    await clearTable('market_adapter')
    await ctx.db.insert('market_adapter', args.market_adapter)
    await clearTable('valuation')
    await ctx.db.insert('valuation', args.valuation)
    await clearTable('sync_metadata')
    await ctx.db.insert('sync_metadata', { ...args.sync_metadata, contract_version: 2 })

    // State: clear and re-insert
    const stateEntries = [
      { key: 'cash', value: String(args.status.cash) },
      { key: 'initial_cash', value: String(args.status.initial_cash) },
      { key: 'realized_pnl', value: String(args.status.realized_pnl) },
      { key: 'nav', value: String(args.status.nav) }
    ]
    await clearTable('state')
    for (const entry of stateEntries) {
      await ctx.db.insert('state', entry)
    }

    await clearTable('data_lifecycle')
    await ctx.db.insert('data_lifecycle', args.data_lifecycle)

    // Holdings: clear and re-insert
    await clearTable('holdings')
    for (const h of args.status.holdings) {
      await ctx.db.insert('holdings', {
        ticker: h.ticker,
        shares: h.signed_shares,
        avg_cost_basis: h.avg_cost_basis,
        market_price: h.market_price,
        market_value: h.market_value,
        unrealized_pnl: h.unrealized_pnl,
        trading_currency: args.market_adapter.native_currency ?? args.status.reporting_currency,
        trade_style: h.trade_style ?? undefined,
        quote_source: h.quote_source ?? undefined,
        quote_asof: h.quote_asof ?? undefined,
        quote_age_hours: h.quote_age_hours ?? undefined,
        last_updated: h.quote_asof ?? args.valuation.valued_at,
        opened_at: h.opened_at ?? undefined
      })
    }

    // Theses: clear and re-insert
    await clearTable('theses')
    for (const t of args.theses_active) {
      await ctx.db.insert('theses', {
        ticker: t.ticker,
        direction: t.direction,
        confidence: t.confidence,
        horizon: t.horizon,
        target: t.target,
        invalidation: t.invalidation,
        catalyst: t.catalyst,
        variant_view: t.variant_view,
        sources_json: t.sources_json,
        status: 'ACTIVE',
        created_at: t.created_at,
        investment_success_probability: t.investment_success_probability ?? undefined,
        ev_model: t.ev_model ?? undefined,
        scenario_json: t.scenario_json ?? undefined,
        expected_return_pct: t.expected_return_pct ?? undefined
      })
    }
    for (const t of args.theses_closed) {
      await ctx.db.insert('theses', {
        ticker: t.ticker,
        direction: t.direction,
        confidence: t.confidence ?? 0,
        horizon: '',
        target: 0,
        invalidation: '',
        catalyst: '',
        variant_view: '',
        sources_json: '',
        status: 'CLOSED',
        created_at: t.closed_at ?? t.lesson ?? 'unknown',
        outcome: t.outcome,
        lesson: t.lesson,
        closed_at: t.closed_at,
        exit_reason: t.exit_reason,
        timing_accuracy: t.timing_accuracy,
        was_calibrated: t.was_calibrated
      })
    }

    // Trades: clear and re-insert
    await clearTable('trades')
    for (const t of args.trades) {
      await ctx.db.insert('trades', {
        ticker: t.ticker,
        action: t.action,
        shares: t.shares,
        price: t.price,
        total: t.total,
        reason: t.reason,
        timestamp: t.timestamp
      })
    }

    // Journal: clear and re-insert
    await clearTable('decision_journal')
    for (const j of args.journal) {
      await ctx.db.insert('decision_journal', {
        entry_type: j.entry_type,
        content: j.content,
        timestamp: j.timestamp
      })
    }

    // Snapshots: clear and re-insert
    await clearTable('snapshots')
    for (const s of args.nav_history) {
      await ctx.db.insert('snapshots', {
        cash: s.cash,
        holdings_value: s.holdings_value,
        total: s.v,
        holdings_json: '[]',
        benchmark_price: s.benchmark_price ?? undefined,
        timestamp: s.t
      })
    }

    // Market feed: clear and re-insert
    await clearTable('market_feed')
    for (const f of args.feed) {
      await ctx.db.insert('market_feed', {
        source_type: f.source_type,
        observation: f.observation,
        source_urls: f.source_urls,
        created_at: f.created_at
      })
    }

    // Research library: clear and re-insert
    await clearTable('research_library')
    for (const r of args.research) {
      await ctx.db.insert('research_library', {
        ticker: r.ticker,
        sector: r.sector,
        topic: r.topic,
        findings: r.findings,
        sources_json: r.sources_json,
        created_at: r.created_at,
        run_id: undefined
      })
    }

    // Learning log: clear and re-insert
    await clearTable('learning_log')
    if (args.learning) {
      await ctx.db.insert('learning_log', {
        summary: args.learning.lessons ?? '',
        win_rate_pct: args.learning.win_rate_pct ?? undefined,
        brier_score: args.learning.brier_score ?? undefined,
        calibration_drift: args.learning.calibration_drift ?? undefined,
        lessons: args.learning.lessons ?? undefined,
        created_at: args.learning.created_at
      })
    }

    // Runs: clear and re-insert
    await clearTable('runs')
    for (const r of args.runs) {
      await ctx.db.insert('runs', {
        market_date: r.market_date,
        session_label: r.session_label ?? undefined,
        status: r.status,
        report: r.report,
        created_at: r.created_at,
        completed_at: r.completed_at ?? undefined,
        decision_model_version: r.decision_model_version ?? undefined,
        parameter_version: r.parameter_version ?? undefined,
        schedule_version: r.schedule_version ?? undefined
      })
    }

    // Intel sources: clear and re-insert
    await clearTable('intel_sources')
    for (const s of args.intel_source_stats) {
      await ctx.db.insert('intel_sources', {
        name: s.name,
        feed_url: s.feed_url,
        source_type: s.source_type,
        enabled: s.enabled,
        added_at: new Date().toISOString(),
        last_fetch_at: s.last_fetch_at,
        total_fetched: s.total_fetched,
        unique_count: s.unique_count,
        duplicate_count: s.duplicate_count,
        ticker_mentions: s.ticker_mentions,
        reason_disabled: s.reason_disabled ?? undefined,
        relevance_pass_rate: s.relevance_pass_rate,
        relevance_checked: s.relevance_checked,
        llm_rescued_count: s.llm_rescued_count
      })
    }

    // Quotes: clear and re-insert
    await clearTable('quotes')
    for (const q of args.quotes) {
      await ctx.db.insert('quotes', {
        ticker: q.ticker,
        price: q.price,
        source: q.source,
        asof: q.asof,
        recorded_at: q.recorded_at
      })
    }

    // Historical prices: clear and re-insert
    await clearTable('historical_prices')
    for (const p of args.historical_prices) {
      await ctx.db.insert('historical_prices', {
        ticker: p.ticker,
        date: p.date,
        open: p.open ?? undefined,
        high: p.high ?? undefined,
        low: p.low ?? undefined,
        close: p.close,
        volume: p.volume ?? undefined
      })
    }

    // Intel articles: clear and re-insert
    await clearTable('intel_articles')
    for (const a of args.intel_articles) {
      await ctx.db.insert('intel_articles', {
        source_id: a.source_id,
        fingerprint: a.fingerprint,
        title: a.title,
        link: a.link,
        summary: a.summary ?? undefined,
        source_domain: a.source_domain ?? undefined,
        tickers: a.tickers ?? undefined,
        created_at: a.created_at
      })
    }

    // Source scores: clear and re-insert
    await clearTable('source_scores')
    for (const s of args.source_scores) {
      await ctx.db.insert('source_scores', {
        domain: s.domain,
        wins: s.wins,
        losses: s.losses,
        flats: s.flats,
        last_updated: s.last_updated
      })
    }

    await clearTable('decisions')
    for (const decision of args.decisions) {
      await ctx.db.insert('decisions', {
        local_id: decision.id,
        run_id: decision.run_id ?? undefined,
        action: decision.action,
        ticker: decision.ticker ?? undefined,
        rationale: decision.rationale,
        evidence_json: decision.evidence_json,
        cash_reason: decision.cash_reason ?? undefined,
        decision_model_version: decision.decision_model_version ?? undefined,
        parameter_version: decision.parameter_version ?? undefined,
        timestamp: decision.timestamp
      })
    }

    await clearTable('candidate_evaluations')
    for (const candidate of args.candidate_evaluations) {
      await ctx.db.insert('candidate_evaluations', {
        evaluation_id: candidate.id,
        run_id: candidate.run_id ?? undefined,
        ticker: candidate.ticker,
        thesis_type: candidate.thesis_type,
        research_depth: candidate.research_depth,
        status: candidate.status,
        preliminary_score: candidate.preliminary_score,
        rank: candidate.rank ?? undefined,
        quote_price: candidate.quote_price,
        quote_source: candidate.quote_source,
        quote_asof: candidate.quote_asof,
        benchmark_price: candidate.benchmark_price ?? undefined,
        benchmark_source: candidate.benchmark_source ?? undefined,
        benchmark_asof: candidate.benchmark_asof ?? undefined,
        binding_rejection_gate: candidate.binding_rejection_gate ?? undefined,
        gate_outcomes_json: candidate.gate_outcomes_json,
        sources_json: candidate.sources_json,
        snapshot_json: candidate.snapshot_json,
        evaluated_at: candidate.evaluated_at,
        hard_gates_json: candidate.hard_gates_json,
        hard_gate_pass: candidate.hard_gate_pass,
        score_components_json: candidate.score_components_json,
        weighted_score: candidate.weighted_score ?? undefined,
        scoring_model_version: candidate.scoring_model_version ?? undefined,
        legacy_result: candidate.legacy_result ?? undefined,
        shadow_recommendation: candidate.shadow_recommendation ?? undefined
      })
    }

    await clearTable('candidate_outcomes')
    for (const outcome of args.candidate_outcomes) {
      await ctx.db.insert('candidate_outcomes', {
        evaluation_id: outcome.evaluation_id,
        horizon_sessions: outcome.horizon_sessions,
        outcome_date: outcome.outcome_date,
        candidate_price: outcome.candidate_price,
        benchmark_price: outcome.benchmark_price ?? undefined,
        candidate_return_pct: outcome.candidate_return_pct,
        benchmark_return_pct: outcome.benchmark_return_pct ?? undefined,
        active_return_pct: outcome.active_return_pct ?? undefined,
        marked_at: outcome.marked_at
      })
    }

    await clearTable('opportunity_audits')
    for (const audit of args.opportunity_audits) {
      await ctx.db.insert('opportunity_audits', {
        triggered: audit.triggered,
        sessions_required: audit.sessions_required,
        sessions_observed: audit.sessions_observed,
        low_exposure_sessions: audit.low_exposure_sessions,
        exposure_threshold_pct: audit.exposure_threshold_pct,
        average_exposure_pct: audit.average_exposure_pct ?? undefined,
        screened_candidates: audit.screened_candidates,
        ranked_candidates: audit.ranked_candidates,
        deep_candidates: audit.deep_candidates,
        approved_candidates: audit.approved_candidates,
        rejected_candidates: audit.rejected_candidates,
        top_rejection_gate: audit.top_rejection_gate ?? undefined,
        diagnostics_json: audit.diagnostics_json,
        window_start: audit.window_start ?? undefined,
        window_end: audit.window_end ?? undefined,
        generated_at: audit.generated_at
      })
    }

    // Usage is an append/update ledger rather than a replace-all snapshot.
    // Active Hermes sessions can report larger totals on a later sync.
    for (const usage of args.llm_usage) {
      const existing = await ctx.db
        .query('llm_usage')
        .withIndex('by_usage_key', q => q.eq('usage_key', usage.usage_key))
        .first()
      const row = {
        usage_key: usage.usage_key,
        session_id: usage.session_id,
        root_session_id: usage.root_session_id,
        job_id: usage.job_id ?? undefined,
        job_name: usage.job_name,
        source: usage.source,
        model: usage.model,
        provider: usage.provider,
        task: usage.task ?? undefined,
        started_at: usage.started_at,
        ended_at: usage.ended_at ?? undefined,
        api_calls: usage.api_calls,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_read_tokens: usage.cache_read_tokens,
        cache_write_tokens: usage.cache_write_tokens,
        reasoning_tokens: usage.reasoning_tokens,
        estimated_cost_usd: usage.estimated_cost_usd,
        actual_cost_usd: usage.actual_cost_usd,
        cost_status: usage.cost_status
      }
      if (existing) {
        await ctx.db.patch(existing._id, row)
      } else {
        await ctx.db.insert('llm_usage', row)
      }
    }

    return { synced: true as const, at: new Date().toISOString(), contractVersion: 2 as const }
  }
})
