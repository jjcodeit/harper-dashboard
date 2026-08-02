import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // One private Harper profile per user-owned dashboard deployment.
  dashboard_profile: defineTable({
    preferred_name: v.optional(v.string()),
    user_timezone: v.string(),
    portfolio_currency: v.string(),
    initial_capital: v.number()
  }),

  portfolio_config: defineTable({
    market_id: v.string(),
    market_label: v.string(),
    portfolio_currency: v.string(),
    benchmark_ticker: v.optional(v.string()),
    benchmark_name: v.optional(v.string()),
    benchmark_mode: v.string(),
    cost_mode: v.string()
  }),

  market_adapter: defineTable({
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

  valuation: defineTable({
    valued_at: v.string(),
    status: v.union(v.literal('FRESH'), v.literal('STALE'), v.literal('UNAVAILABLE')),
    portfolio_currency: v.string(),
    stale_tickers: v.array(v.string()),
    gross_realized_pnl: v.number(),
    trading_costs: v.number(),
    portfolio_heat_pct: v.number(),
    risk_data_missing: v.array(v.string())
  }),

  sync_metadata: defineTable({
    source_updated_at: v.string(),
    synced_at: v.string(),
    complete: v.boolean(),
    contract_version: v.number()
  }),

  // State key-value store
  state: defineTable({
    key: v.string(),
    value: v.string()
  }).index('by_key', ['key']),

  // Holdings / positions
  holdings: defineTable({
    ticker: v.string(),
    shares: v.number(),
    avg_cost_basis: v.number(),
    market_price: v.optional(v.number()),
    market_value: v.optional(v.number()),
    unrealized_pnl: v.optional(v.number()),
    trading_currency: v.optional(v.string()),
    trade_style: v.optional(v.union(v.literal('INTRADAY'), v.literal('POSITION'))),
    quote_source: v.optional(v.string()),
    quote_asof: v.optional(v.string()),
    quote_age_hours: v.optional(v.number()),
    last_updated: v.string(),
    opened_at: v.optional(v.string())
  }).index('by_ticker', ['ticker']),

  // Trades
  trades: defineTable({
    ticker: v.string(),
    action: v.union(v.literal('BUY'), v.literal('SELL')),
    shares: v.number(),
    price: v.number(),
    total: v.number(),
    reason: v.string(),
    timestamp: v.string()
  }).index('by_ticker', ['ticker']),

  // Active and closed theses
  theses: defineTable({
    ticker: v.string(),
    direction: v.literal('LONG'),
    confidence: v.number(),
    horizon: v.string(),
    target: v.number(),
    invalidation: v.string(),
    catalyst: v.string(),
    variant_view: v.string(),
    sources_json: v.string(),
    status: v.string(),
    created_at: v.string(),
    updated_at: v.optional(v.string()),
    outcome: v.optional(v.string()),
    lesson: v.optional(v.string()),
    closed_at: v.optional(v.string()),
    exit_reason: v.optional(v.string()),
    timing_accuracy: v.optional(v.string()),
    was_calibrated: v.optional(v.number()),
    investment_success_probability: v.optional(v.number()),
    ev_model: v.optional(v.string()),
    scenario_json: v.optional(v.string()),
    expected_return_pct: v.optional(v.number()),
    thesis_type: v.optional(v.union(v.literal('CATALYST'), v.literal('QUALITY'), v.literal('VALUE'), v.literal('MOMENTUM'))),
    thesis_contract_json: v.optional(v.string()),
    review_date: v.optional(v.string())
  }).index('by_status', ['status']),

  // Quotes
  quotes: defineTable({
    ticker: v.string(),
    price: v.number(),
    source: v.string(),
    asof: v.string(),
    recorded_at: v.string()
  }).index('by_ticker', ['ticker']),

  // Runs
  runs: defineTable({
    market_date: v.string(),
    session_label: v.optional(v.string()),
    status: v.string(),
    report: v.optional(v.string()),
    created_at: v.string(),
    completed_at: v.optional(v.string()),
    decision_model_version: v.optional(v.string()),
    parameter_version: v.optional(v.string()),
    schedule_version: v.optional(v.string())
  }).index('by_date', ['market_date']),

  // Decision journal
  decision_journal: defineTable({
    entry_type: v.string(),
    content: v.string(),
    timestamp: v.string(),
    run_id: v.optional(v.number())
  }).index('by_type', ['entry_type']),

  // Structured portfolio decisions, including NO_TRADE records.
  decisions: defineTable({
    local_id: v.number(),
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
  }).index('by_timestamp', ['timestamp']),

  // Point-in-time opportunity-funnel records.
  candidate_evaluations: defineTable({
    evaluation_id: v.number(),
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
  })
    .index('by_evaluation_id', ['evaluation_id'])
    .index('by_ticker_time', ['ticker', 'evaluated_at'])
    .index('by_status_depth', ['status', 'research_depth']),

  candidate_outcomes: defineTable({
    evaluation_id: v.number(),
    horizon_sessions: v.union(v.literal(5), v.literal(10), v.literal(20)),
    outcome_date: v.string(),
    candidate_price: v.number(),
    benchmark_price: v.optional(v.number()),
    candidate_return_pct: v.number(),
    benchmark_return_pct: v.optional(v.number()),
    active_return_pct: v.optional(v.number()),
    marked_at: v.string()
  }).index('by_evaluation_horizon', ['evaluation_id', 'horizon_sessions']),

  opportunity_audits: defineTable({
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
  }).index('by_generated_at', ['generated_at']),

  // Snapshots for NAV history
  snapshots: defineTable({
    cash: v.number(),
    holdings_value: v.number(),
    total: v.number(),
    holdings_json: v.string(),
    benchmark_price: v.optional(v.number()),
    timestamp: v.string()
  }),

  // Market feed
  market_feed: defineTable({
    source_type: v.string(),
    observation: v.string(),
    source_urls: v.string(),
    created_at: v.string(),
    run_id: v.optional(v.number())
  }),

  // Research library
  research_library: defineTable({
    ticker: v.string(),
    sector: v.optional(v.string()),
    topic: v.string(),
    findings: v.string(),
    sources_json: v.string(),
    created_at: v.string(),
    run_id: v.optional(v.number())
  }).index('by_ticker', ['ticker']),

  // Learning log
  learning_log: defineTable({
    period_start: v.optional(v.string()),
    period_end: v.optional(v.string()),
    summary: v.string(),
    alpha_pct: v.optional(v.number()),
    win_rate_pct: v.optional(v.number()),
    brier_score: v.optional(v.number()),
    calibration_drift: v.optional(v.number()),
    lessons: v.optional(v.string()),
    created_at: v.string()
  }),

  // Source scores
  source_scores: defineTable({
    domain: v.string(),
    wins: v.number(),
    losses: v.number(),
    flats: v.number(),
    last_updated: v.string()
  }).index('by_domain', ['domain']),

  // Intel sources
  intel_sources: defineTable({
    name: v.string(),
    feed_url: v.string(),
    source_type: v.string(),
    enabled: v.number(),
    added_at: v.string(),
    last_fetch_at: v.optional(v.string()),
    total_fetched: v.optional(v.number()),
    unique_count: v.optional(v.number()),
    duplicate_count: v.optional(v.number()),
    ticker_mentions: v.optional(v.number()),
    reason_disabled: v.optional(v.string()),
    relevance_pass_rate: v.optional(v.number()),
    relevance_checked: v.optional(v.number()),
    llm_rescued_count: v.optional(v.number())
  }),

  // Intel articles
  intel_articles: defineTable({
    source_id: v.number(),
    fingerprint: v.string(),
    title: v.string(),
    link: v.string(),
    summary: v.optional(v.string()),
    source_domain: v.optional(v.string()),
    tickers: v.optional(v.string()),
    created_at: v.string()
  }).index('by_fingerprint', ['fingerprint']),

  // Historical prices
  historical_prices: defineTable({
    ticker: v.string(),
    date: v.string(),
    open: v.optional(v.number()),
    high: v.optional(v.number()),
    low: v.optional(v.number()),
    close: v.number(),
    volume: v.optional(v.number())
  }).index('by_ticker_date', ['ticker', 'date']),

  // One current summary of the local hot/archive lifecycle.
  data_lifecycle: defineTable({
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

  // Per-model accounting imported from Hermes for Harper-only sessions.
  llm_usage: defineTable({
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
  })
    .index('by_usage_key', ['usage_key'])
    .index('by_started_at', ['started_at'])
})
