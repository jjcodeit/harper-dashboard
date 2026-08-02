# Harper Dashboard — Global, User-Adaptive UX and Microcopy Plan

## Objective

Make Harper’s dashboard understandable to a first-time investor while allowing it to adapt to each user’s:

- Time zone
- Language and locale
- Display and reporting currency
- Markets and trading venues
- Benchmark
- Data providers and authoritative sources
- Date, number, and percentage conventions

Harper’s personality should remain direct, observant, risk-aware, and comfortable holding cash. Localization must change how information is presented without changing the meaning of the underlying portfolio data.

All copy marked **User-facing copy** is intended for the interface. It contains no internal codes, model names, database language, developer instructions, or operational identifiers.

---

## 1. Core design principles

### 1.1 Never assume one country, market, currency, or time zone

The dashboard must not hardcode:

- A currency symbol or digit-grouping system
- A single exchange or trading calendar
- A fixed market time zone
- A single benchmark
- One source hierarchy for every jurisdiction
- Country-specific tax, settlement, fee, or regulatory terminology

### 1.2 Keep stored values separate from displayed values

Store canonical values with explicit metadata:

- Currency code
- Source
- Source timestamp
- Exchange or venue
- Exchange time zone
- Reporting period
- Conversion rate and conversion timestamp, where applicable

Format values only at the presentation layer using the user’s preferences.

### 1.3 Never hide currency conversion

A multi-market portfolio may contain investments priced in different currencies. The dashboard must distinguish:

1. **Trading currency** — the currency in which the investment is priced.
2. **Portfolio currency** — the currency used to calculate portfolio totals and performance.
3. **Display currency** — the user’s preferred currency for viewing the dashboard.

When conversion is required, show the exchange-rate source and timestamp. Never silently mix currencies or treat a converted value as the original market price.

### 1.4 Adapt sources to the market and claim

The best source depends on the instrument and jurisdiction. Source selection should be configured by market rather than embedded in copy or business logic.

Preferred order:

1. Exchange, regulator, government, or benchmark administrator
2. Issuer-filed results, reports, announcements, and transcripts
3. Official industry or economic data
4. Reputable reporting with attributable facts
5. Market-data vendors and aggregators
6. Research commentary and opinion

The user should see the source name and freshness, not internal source tiers.

---

## 2. User preference and portfolio settings

### User preferences

Support the following settings:

| Setting | Example values | Default behavior |
|---|---|---|
| Display time zone | America/New_York, Europe/London, Asia/Singapore | Browser or account time zone |
| Locale | en-US, en-GB, de-DE, fr-FR | Account language and region |
| Display currency | USD, EUR, GBP, JPY | Portfolio reporting currency |
| Date style | Local standard, concise, ISO | Local standard |
| Time style | 12-hour or 24-hour | Locale default |
| Number format | Locale grouping and decimals | Locale default |
| Week start | Sunday or Monday | Locale default |
| Language | Supported interface languages | Account language |

### Portfolio settings

Support the following portfolio-level settings:

| Setting | Purpose |
|---|---|
| Portfolio reporting currency | Canonical currency for NAV, return, cash, and risk calculations |
| Starting capital | Initial virtual capital in the reporting currency |
| Permitted markets | Exchanges and venues Harper may research or simulate |
| Permitted instruments | Equity, fund, or other explicitly supported instrument types |
| Benchmark | Portfolio-appropriate total-return benchmark |
| Source policy | Authoritative source hierarchy by jurisdiction and instrument |
| Trading calendar | Venue-specific market sessions and holidays |
| Cost model | Fees and slippage assumptions by venue and instrument |

### User-facing settings copy

- Heading: **Display preferences**
- Supporting line: **Choose how dates, times, and money appear on your dashboard.**
- Field: **Time zone**
- Field: **Display currency**
- Field: **Language and region**
- Field: **Date and time format**
- Note: **Changing the display currency does not change the portfolio’s underlying trades or performance.**

### Portfolio settings copy

- Heading: **Portfolio settings**
- Supporting line: **See the markets, currency, benchmark, and rules used for this virtual portfolio.**
- Field: **Portfolio currency**
- Field: **Starting value**
- Field: **Markets covered**
- Field: **Performance benchmark**
- Field: **Estimated trading costs**

---

## 3. Highest-priority issues to fix in the current dashboard

### 3.1 Portfolio figures must tell one consistent story

Use one canonical portfolio snapshot for the hero, summary cards, allocation, chart endpoint, and plain-English performance sentence.

Every value must include:

- Reporting currency
- Valuation timestamp
- Data freshness status
- Conversion status when multiple currencies are involved

**User-facing copy — mismatch fallback**

> Performance history is temporarily unavailable because the latest total does not match the recorded history. The current portfolio value is still shown above.

### 3.2 Stored or delayed prices must not look current

Never place an old price under a generic **Current price** label.

**User-facing copy**

- Label: **Last available price**
- Status: **Price needs updating**
- Helper: **Last checked [date and time]. The current value and gain or loss may have changed.**
- Warning: **Some investments do not have recent prices, so the portfolio value is an estimate.**

### 3.3 Times must follow the user while preserving market context

Display the primary timestamp in the user’s time zone. Show the exchange-local time where it helps explain market status or execution.

**User-facing copy**

> Updated 28 Jul 2026, 5:34 am PDT

**User-facing copy — exchange context**

> Market closed · Reopens 29 Jul at 9:30 am ET

### 3.4 Today’s brief must not repeat items

Render one ranked list with unique items. Limit the default view to the three most important updates.

### 3.5 Internal product language must not appear in the standard dashboard

Remove phase numbers, model labels, version identifiers, parameter hashes, gate codes, score thresholds, internal run names, database states, and implementation terminology.

Keep technical identifiers in a restricted diagnostic view only.

---

## 4. Recommended page structure

1. **Today**
2. **Investments**
3. **Performance**
4. **Portfolio mix**
5. **Ideas reviewed**
6. **How Harper works**
7. **Decisions and research**
8. **Data status**
9. **Operating cost**
10. **Settings**

---

## 5. Header and opening summary

### Virtual-portfolio disclosure

**User-facing copy**

- Badge: **Virtual portfolio**
- Supporting line: **A research and learning portfolio. No real orders are placed.**

### Product identity

**User-facing copy**

- Product name: **Harper’s Table**
- Tagline: **Your portfolio, explained clearly.**
- Page heading: **Here’s where the portfolio stands.**
- Supporting line: **Start with the summary, then open any section for the reasoning behind it.**

### Status line

**User-facing copy — all data current**

> Updated [date and time] · Markets open · All investment prices are current

**User-facing copy — price needs updating**

> Updated [date and time] · Markets open · 1 investment price needs updating

**User-facing copy — markets differ**

> Updated [date and time] · 2 markets open · 1 market closed

**User-facing copy — all relevant markets closed**

> Updated [date and time] · Markets closed · Harper can research, but cannot make a simulated trade now

Do not show a single global **Market open** state when the portfolio spans multiple venues.

---

## 6. Top portfolio cards

### Recommended order

1. **Portfolio value**
2. **Since the portfolio started**
3. **Invested now**
4. **Cash available**
5. **Price status**

### User-facing copy

- **Portfolio value**
  - Helper: **Cash plus the latest available value of all open investments.**

- **Since the portfolio started**
  - Example: **−$27.85 · −0.03%**

- **Invested now**
  - Example: **$12,372.50 · 12%**

- **Cash available**
  - Example: **$87,599.65 · 88%**

- **Price status**
  - Current: **All prices are current**
  - Stale: **1 price needs updating**

### Multi-currency state

**User-facing copy**

> Portfolio values are shown in [currency]. Investments priced in other currencies use exchange rates from [source], last updated [date and time].

Do not use **Ready to use** for cash. Cash belongs to the virtual strategy and is not available for withdrawal.

---

## 7. What matters today

### Section copy

**User-facing copy**

- Heading: **What matters today**
- Supporting line: **The most important changes, risks, and next checks in the portfolio.**

### Priority order

1. Risk to an open investment
2. Missing, stale, or inconsistent data
3. Material catalyst or decision
4. Currency or market-session effect
5. Cash level
6. Broader market context

### Card patterns

**Near a planned exit price**

- Label: **Needs attention**
- Title: **[Investment] is close to Harper’s planned exit price**
- Body: **The latest verified price is [distance] above the planned exit level. A move below that level would break the current risk plan.**
- Action: **Review the investment**

**Price is stale**

- Label: **Price needs updating**
- Title: **[Investment] does not have a recent price**
- Body: **The last available price is from [date and time]. The current value and gain or loss may have changed.**
- Action: **See price details**

**Most capital is in cash**

- Label: **Portfolio position**
- Title: **[percentage] of the portfolio remains in cash**
- Body: **Harper has not found enough new ideas that meet every evidence, price, and risk requirement.**
- Action: **See ideas reviewed**

**Currency movement matters**

- Label: **Currency effect**
- Title: **Exchange-rate changes affected the portfolio value**
- Body: **The investments changed by [amount] in their local currencies and by [amount] after conversion to the portfolio currency.**
- Action: **See currency details**

---

## 8. Performance

### Section copy

**User-facing copy**

- Heading: **Portfolio value over time**
- Supporting line: **Cash and investments combined at each recorded update.**
- Range controls: **30 days · 90 days · Since start**

### Plain-English chart summary

**Gain**

> The portfolio gained [amount] ([percent]%) since it started and is now worth [value].

**Loss**

> The portfolio lost [amount] ([percent]%) since it started and is now worth [value].

**Little change**

> The portfolio is broadly unchanged since it started and is now worth [value].

### Currency explanation

**User-facing copy**

> Performance is measured in the portfolio currency. Changes in exchange rates can affect the reported result for investments priced in other currencies.

### Performance details

Use these labels:

| User-facing label | Meaning |
|---|---|
| Portfolio return | Change in portfolio value after estimated costs |
| Compared with [benchmark] | Portfolio return minus benchmark return |
| Largest fall from a previous high | Maximum recorded drawdown |
| Estimated trading costs | Modeled fees and market impact |
| Forecast accuracy | Accuracy of resolved event forecasts |
| Amount at planned risk | Loss if every active planned exit were reached, including buffers |
| Currency effect | Change caused by exchange-rate movements |

**Small forecast sample**

> Only [count] forecasts have been resolved. That is not enough to judge Harper’s forecasting accuracy yet.

---

## 9. Portfolio mix

### Section copy

**User-facing copy**

- Heading: **Where the portfolio is invested**
- Supporting line: **A simple view of cash and open investments in the portfolio currency.**

- **Cash**
  - Helper: **Not exposed to investment price changes.**

- **Investments**
  - Helper: **Latest available value of open investments.**

- **Currency exposure**
  - Helper: **How much of the portfolio is linked to each currency before conversion.**

- **Market exposure**
  - Helper: **How much of the portfolio is invested through each market or venue.**

---

## 10. Investments

### Section copy

**User-facing copy**

- Heading: **Investments**
- Supporting line: **See what Harper paid, what each investment is worth, why it is held, and what could change the view.**
- Search placeholder: **Find an investment**

### Table labels

| Label | Notes |
|---|---|
| Investment | Company, fund, or supported instrument name |
| Market | Exchange or trading venue |
| Average buy price | Shown in the investment’s trading currency |
| Last available price | Shown in the investment’s trading currency |
| Current value | Shown in the portfolio currency |
| Target price | Shown in the investment’s trading currency |
| Gain or loss | Show local-currency and portfolio-currency effects when useful |
| Share of portfolio | Portfolio weight |
| Forecast confidence | Probability assigned to the declared event |
| Status | Current review state |

### Position-style labels

- Long-only direction: omit from the default view
- Multi-session holding: **Held across days**
- Same-session holding: **Same-day investment**

### Position details

Each expanded investment should answer:

1. What Harper owns
2. Where and in which currency it trades
3. How it is performing
4. Why Harper owns it
5. What would prove the idea wrong
6. What event comes next
7. How current and trustworthy the price is
8. How currency conversion affects the displayed value

### User-facing copy

- **Why Harper owns it**
- **What could change the view**
- **Planned exit price**
- **Next event**
- **Forecast confidence**
- **Price last checked**
- **Trading currency**
- **Portfolio value**
- **Exchange rate used**
- **Source**

### Confidence tooltip

> Harper’s estimated chance that the stated forecast event will happen. It is not the expected investment return and does not guarantee a gain.

### Distance labels

- **11.4% below target**
- **3.2% above planned exit price**

Never show a bare percentage when it could mean portfolio weight, position completion, return, or distance to a price level.

---

## 11. Market context

### Section copy

**User-facing copy**

- Heading: **Market context**
- Supporting line: **Market conditions Harper considered. They provide context, but do not decide an investment on their own.**

### Market grouping

Group context by relevance:

- Portfolio-wide conditions
- Market or region
- Currency
- Interest rates
- Commodities
- Sector
- Company-specific event

### Source and time copy

**User-facing copy — current**

> Market data from [source] · Updated [date and time]

**User-facing copy — delayed**

> Market data from [source] · Delayed · Last updated [date and time]

**User-facing copy — different market time zone**

> Updated [user-local time] · [exchange-local time] at the market

Never say **Live data** unless the source and data contract guarantee real-time delivery.

---

## 12. Ideas Harper reviewed

### Section copy

**User-facing copy**

- Heading: **Ideas Harper reviewed**
- Supporting line: **How many investments Harper checked, researched closely, and found suitable for the portfolio.**

### Funnel labels

- **Investments checked**
- **Shortlisted**
- **Researched closely**
- **Met every requirement**

### Summary

> Harper checked [count] investments, researched [count] closely, and found [count] that met every evidence, price, and risk requirement.

### Rejection reasons

Translate internal rules into ordinary language:

- **Not enough reliable evidence**
- **Potential return did not justify the risk**
- **The planned exit was not clear enough**
- **The latest price was not reliable enough**
- **The investment would make the portfolio too concentrated**
- **The market was closed or the investment could not be traded reliably**
- **Currency risk was too high for the expected return**

### Near-miss ideas

**User-facing copy**

- Label: **Missed by one requirement**
- Supporting line: **These ideas passed the other checks but still were not suitable for the portfolio.**
- Action: **See near-miss ideas**

### Later review

**User-facing copy**

- Heading: **What rejected ideas did next**
- Supporting line: **A later price check helps Harper learn whether rejecting an idea was sensible. It does not turn the original decision into a backtest.**

Use the portfolio benchmark selected in settings. Do not hardcode a country-specific index.

---

## 13. How Harper works

### Section copy

**User-facing copy**

- Heading: **How Harper works**
- Supporting line: **The checks Harper uses before making or changing a virtual investment.**

### Core checks

1. **Reliable evidence** — **Important claims must be supported by trustworthy sources.**
2. **Enough potential upside** — **The possible gain must justify the planned downside after estimated costs.**
3. **Clear risk limit** — **Every investment needs a price and condition that would prove the idea wrong.**
4. **Current market data** — **Harper will not act on an old or mismatched price.**
5. **Portfolio fit** — **A new investment must stay within concentration and total-risk limits.**
6. **Currency awareness** — **Expected returns must still make sense after currency risk and conversion costs.**

### Market schedule

Do not publish one fixed schedule for every user. Build the schedule from the relevant venue calendars and show it in the user’s time zone.

**User-facing copy**

- Heading: **When Harper checks the markets**
- Supporting line: **Review times follow the markets used by this portfolio and are shown in your time zone.**

Example labels:

- **Before the market opens**
- **Market-open check**
- **First trading review**
- **Mid-session review**
- **Final decisions**
- **End-of-day update**

---

## 14. Decisions and research

### Activity grouping

Group records by completed review. Show one primary outcome and place supporting actions beneath it.

### Tabs

**User-facing copy**

- **All activity**
- **Investments**
- **No-trade decisions**
- **Research**
- **Lessons**
- **Data status**

### Decision labels

- **Bought**
- **Sold**
- **Held the investment**
- **No new trade**
- **Idea closed**
- **Waiting for the official result**

### Decision summaries

**Held an investment**

> Held [investment]. The price remains above Harper’s planned exit level, but [new evidence] has weakened the original case. Next check: [event].

**No new trade**

> No new trade. The ideas reviewed today did not meet every evidence, price, and risk requirement.

**Bought an investment**

> Bought [quantity] shares of [investment] at an average simulated price of [price]. Harper’s target is [target], with a planned exit price of [exit price].

**Market closed**

> No trade. The relevant market was closed, so Harper used the review for research and checking existing investments.

**Currency affected the result**

> The investment gained in its trading currency, but currency movement reduced the gain when measured in the portfolio currency.

### Actions

- **Read full reasoning**
- **See supporting sources**
- **Review the investment**
- **See currency details**

---

## 15. Research and lessons

### Research

**User-facing copy**

- Heading: **Research Harper kept**
- Supporting line: **Verified findings that may be useful in a future decision. Older research is rechecked before it is used again.**

Statuses:

- **New lead**
- **Checked against a source**
- **Saved for later**
- **No longer current**

### Lessons

**User-facing copy**

- Heading: **What Harper learned**
- Supporting line: **Lessons recorded after checking what happened, what the investment returned, and whether the decision followed the rules.**

Keep forecast accuracy, investment return, process quality, and currency effects separate.

---

## 16. Data status and sources

### Section copy

**User-facing copy**

- Heading: **Data status**
- Supporting line: **When prices, exchange rates, portfolio totals, benchmark values, and research sources were last updated.**

### Status labels

- **Current**
- **Needs updating**
- **Unavailable**
- **Update in progress**
- **Last review completed**
- **Last review did not finish**
- **Waiting for the official result**

### Source display

For each material value or claim, support:

- Source name
- Source type
- Published or market timestamp
- Last checked time
- Market or jurisdiction
- Direct source link where permitted

### User-facing states

**Price needs updating**

> [Investment]’s last available price is from [date and time]. Portfolio value and gain or loss may have changed since then.

**Exchange rate needs updating**

> The latest exchange rate is from [date and time]. Converted portfolio values may have changed since then.

**Benchmark unavailable**

> A current value for [benchmark] is not available, so the portfolio cannot be compared with it right now.

**Update failed**

> The latest dashboard update did not finish. The last complete update was [date and time].

**Review did not finish**

> Harper’s latest portfolio review did not finish. No incomplete action is shown as completed.

**Source unavailable**

> The original source is temporarily unavailable. Harper will not treat the claim as confirmed until it can be checked again.

---

## 17. Operating cost

### Section copy

**User-facing copy**

- Heading: **Harper’s operating cost**
- Supporting line: **What it cost to run portfolio reviews, answer questions, and gather research.**

### Primary metrics

1. **Estimated cost**
2. **Portfolio reviews and conversations**
3. **Research activity**

Use the user’s display currency only when a reliable exchange rate is available. Always preserve the provider’s original billing currency in the detail view.

### Cost states

- **Reported cost** — **The provider supplied the final cost.**
- **Estimated cost** — **The provider did not supply a final cost, so Harper used the available usage estimate.**
- **No model charge reported** — **The provider reported no usage charge for these sessions.**
- **Cost unavailable** — **The provider did not supply enough information to calculate a reliable cost.**

Move tokens, cache usage, provider calls, model details, and original billing currency under **See technical usage details**.

---

## 18. Harper voice guide

### Use Harper’s personality for

- Today’s brief
- Decision summaries
- Investment reasoning
- Research conclusions
- Lessons

### Use neutral language for

- Price and currency warnings
- Errors
- Data status
- Metric definitions
- Accessibility labels
- Settings
- Operating cost explanations

### Harper should sound

- Direct
- Alert to risk
- Comfortable holding cash
- Honest when evidence is incomplete
- Precise without sounding academic
- Dry, but never theatrical

### User-facing examples

- **No trade. The evidence was good; the price was not.**
- **The investment case still works. The margin for error is getting smaller.**
- **Cash stays available until an idea clears every check.**
- **The forecast was right. The investment still lost money after costs.**
- **The official result is not available yet, so the forecast remains unsettled.**
- **The investment gained locally. Currency movement took some of that gain back.**

### Avoid

- Raw internal codes
- Product-development language
- Model or version names
- Database, sync, pipeline, or engine terminology
- Unexplained acronyms
- Market-specific slang unless the user has chosen an advanced view
- Certainty about future gains
- Jokes in warnings or errors

---

## 19. Empty, loading, warning, and error states

### No open investments

- Title: **No open investments**
- Body: **Harper is holding cash because no current idea has passed every evidence, price, and risk check.**

### No new trade

- Title: **No new trade**
- Body: **Harper reviewed the available ideas and found no setup with enough potential upside for the planned risk after estimated costs.**

### No useful research leads

- Title: **No useful leads yet**
- Body: **The latest research did not produce a verified, testable investment idea.**

### No markets configured

- Title: **No markets selected**
- Body: **Choose the markets this portfolio should follow before Harper begins researching investments.**
- Action: **Choose markets**

### No benchmark configured

- Title: **No benchmark selected**
- Body: **Choose a benchmark to compare the portfolio with the market or strategy it is designed to follow.**
- Action: **Choose a benchmark**

### Loading

- **Loading the latest portfolio update…**
- **Checking investment prices…**
- **Updating exchange rates…**
- **Loading Harper’s latest decisions…**

### Some prices are old

- Title: **Some prices need updating**
- Body: **The portfolio value may have changed because recent prices are not available for: [investments].**
- Action: **See affected investments**

### Currency conversion unavailable

- Title: **Currency conversion is unavailable**
- Body: **Some investments are priced in another currency, and a reliable exchange rate is not available. The portfolio total cannot be calculated accurately right now.**

### Portfolio data unavailable

- Title: **Portfolio data is unavailable**
- Body: **The dashboard could not load the latest complete portfolio update.**
- Supporting line: **Last complete update: [date and time].**
- Action: **Try again**

### Waiting for a forecast result

- Title: **Waiting for the official result**
- Body: **The investment is closed, but the declared source has not published enough information to mark the forecast yes or no.**

---

## 20. Global formatting rules

### Money

- Store ISO 4217 currency codes with every monetary value.
- Format money with the user’s locale and the value’s currency.
- Do not manually prepend symbols.
- Use the portfolio currency for NAV, return, cash, risk, and benchmark comparison.
- Use the investment’s trading currency for price, target, and planned exit levels.
- Show the original and converted values when conversion materially affects interpretation.
- Preserve the provider’s original billing currency for operating costs.
- Never show an unknown amount as zero.

### Numbers and percentages

- Use locale-aware grouping and decimal separators.
- Use a leading plus or minus sign on changes.
- Use **percentage points** when comparing two percentage returns.
- Do not assume two decimal places for every currency.
- Use the correct minor-unit rules for the currency.

### Dates and times

- Store timestamps in UTC with the originating time zone where relevant.
- Display primary timestamps in the user’s selected time zone.
- Show exchange-local time when explaining sessions, market status, or simulated fills.
- Use the locale’s 12-hour or 24-hour convention.
- Do not place manually typed times inside narrative text when structured timestamps exist.

### Markets and symbols

- Display the venue when a symbol may be ambiguous.
- Do not assume ticker suffix rules are shared across providers.
- Use stable instrument IDs internally and market-appropriate display symbols externally.
- Support different trading days, holidays, daylight-saving changes, settlement rules, and session structures by venue.

### Sources

- Do not hardcode provider names in microcopy.
- Show the actual source attached to each value or claim.
- Never label delayed, cached, or stored data as live.
- Do not treat one source hierarchy as authoritative for every market.

### Historical analysis

Use:

- Label: **Historical price replay**
- Explanation: **This uses later price data and is not a strategy backtest.**

---

## 21. Data and application architecture changes

### 21.1 Add a localization contract

Create one shared formatting layer used by every component and narrative template.

It should accept:

- Locale
- User time zone
- Display currency
- Portfolio currency
- Value currency
- Exchange time zone
- Precision rules
- Source timestamp

Do not format money, dates, or percentages directly inside individual components.

### 21.2 Add portfolio configuration

The portfolio payload should expose:

- `portfolio_currency`
- `starting_capital`
- `benchmark_id`
- `benchmark_name`
- `permitted_markets`
- `permitted_instruments`
- `cost_model_id`
- `source_policy_id`

### 21.3 Add instrument and venue metadata

Every investment should expose:

- Stable instrument ID
- Display name
- Display symbol
- Venue ID and name
- Trading currency
- Venue time zone
- Country or jurisdiction
- Instrument type
- Price precision
- Quantity precision

### 21.4 Add exchange-rate records

Every conversion should include:

- Base currency
- Quote currency
- Rate
- Source
- Source timestamp
- Recorded timestamp
- Conversion method

Portfolio valuation must fail visibly when a required conversion is unavailable or stale beyond the configured limit.

### 21.5 Make market status venue-specific

Replace one global market state with a list of relevant venue states:

- Open
- Closed
- Pre-open
- Closing session
- Halted
- Holiday
- Special session
- Unknown

The dashboard may summarize the list, but the underlying states must remain separate.

### 21.6 Make benchmarks configurable

A benchmark record should include:

- Name
- Identifier
- Currency
- Return type
- Source
- Time zone
- Market scope

Prefer a total-return benchmark when available. Do not substitute a price-only index without telling the user.

### 21.7 Make source policies configurable

Create source policies by jurisdiction, market, instrument, and claim type. A policy should identify preferred authoritative sources without exposing internal ranking codes to users.

### 21.8 Generate narrative copy from structured fields

Decision and status copy should be built from structured values after localization. Do not store final display sentences containing fixed currency symbols, market names, or time zones.

---

## 22. Implementation phases

### Priority 0 — Restore trust in the numbers

- Unify portfolio values across the hero, cards, allocation, investments, and chart.
- Fix stale-price selection and valuation.
- Add currency metadata to all monetary fields.
- Add exchange-rate freshness and conversion fallbacks.
- Fix time-zone inconsistencies.
- Add the virtual-portfolio disclosure.

**Completion test:** No page state can show conflicting totals, mixed currencies, conflicting times, or a stale value as current.

### Priority 1 — Remove market-specific assumptions

- Replace hardcoded currency symbols with locale-aware formatting.
- Replace fixed time-zone labels with user and exchange time-zone formatting.
- Replace hardcoded benchmark and market names with portfolio configuration.
- Replace one global market status with venue-specific states.
- Replace fixed source names with attached source metadata.

**Completion test:** The same UI renders correctly for portfolios using different currencies, markets, benchmarks, and time zones without code changes to components.

### Priority 2 — Add user preferences and portfolio settings

- Add display time zone, locale, display currency, and date/time preferences.
- Add portfolio currency, markets, benchmark, source policy, and cost-model settings.
- Explain the difference between display currency and portfolio currency.

**Completion test:** A user can change display preferences without changing the underlying portfolio history or trade records.

### Priority 3 — Remove internal product language

- Remove model, version, parameter, gate-code, score-threshold, session, and database terminology.
- Translate rejection and status codes into plain language.
- Keep technical detail outside the standard customer experience.

**Completion test:** A non-technical user sees no implementation terminology in the standard dashboard.

### Priority 4 — Rebuild the daily story

- Consolidate duplicated brief items.
- Rank unique items by risk and importance.
- Add currency and multi-market items when material.
- Rewrite decision cards from structured, localized data.
- Group duplicate records from the same review.

**Completion test:** The user can explain today’s main risk, decision, market status, currency effect, and next checkpoint without opening the full record.

### Priority 5 — Improve investments and performance

- Clarify trading currency versus portfolio value.
- Add venue, source, price age, and exchange-rate details.
- Align the chart summary with the selected range and current snapshot.
- Make the benchmark configurable.
- Add accessible text summaries for charts.

**Completion test:** Every displayed number has a clear meaning, currency, period, source, and timestamp.

### Priority 6 — Responsive and accessibility review

- Convert dense tables to cards on small screens.
- Maintain logical heading order.
- Add visible keyboard focus.
- Do not rely on color alone for gains, losses, warnings, or market states.
- Give every chart a text summary.
- Use descriptive actions instead of **More**.
- Ensure locale changes do not cause clipping or broken layouts.

**Completion test:** The core portfolio story works without hover, color, or a wide screen, and remains usable with longer translated labels.

---

## 23. Suggested component-level work

| Area | Work |
|---|---|
| App shell | Load user preferences and portfolio settings before formatting content. |
| Header | Add virtual badge, localized update time, multi-market state, and price-health summary. |
| Portfolio summary | Use one canonical snapshot and portfolio-currency totals. |
| Daily brief | Deduplicate, rank by importance, and include material currency or market-session changes. |
| Performance | Enforce value consistency, configurable benchmark, and currency-effect disclosure. |
| Investments | Show venue, trading currency, portfolio value, price age, source, and conversion details. |
| Portfolio mix | Add currency and market exposure views when relevant. |
| Market context | Group by market and show source, delay status, user time, and exchange-local time. |
| Ideas reviewed | Use generic investment language and plain rejection reasons. |
| How Harper works | Generate market schedules from configured venue calendars. |
| Activity record | Localize structured fields before generating visible summaries. |
| Data status | Show freshness for prices, exchange rates, benchmark values, and sources. |
| Operating cost | Preserve original billing currency and optionally show a converted display value. |
| Settings | Add display preferences and portfolio configuration with clear explanations. |

---

## 24. Acceptance criteria

The revision is ready when:

- The page clearly says it is a virtual portfolio and that no real orders are placed.
- The same frontend can display portfolios from different markets without market-specific component changes.
- No component contains a hardcoded currency symbol, time zone, benchmark, exchange, or data-provider name.
- The hero, allocation, investment list, and performance chart agree on portfolio value.
- Every monetary value has an explicit currency in the data contract.
- Every converted value has a rate, source, and timestamp.
- The dashboard distinguishes trading currency, portfolio currency, and display currency.
- User-visible times follow the selected time zone.
- Market schedules and statuses remain venue-specific.
- A delayed or stored price can never look live or current.
- Today’s brief contains no duplicate cards.
- Standard-view copy contains no model, version, parameter, gate-code, session, database, or sync terminology.
- Every open investment states why it is held, its planned exit price, its next event, and when its price was last checked.
- The performance benchmark is configurable and clearly named.
- Source names and freshness come from the actual attached records.
- Currency conversion failure produces a visible incomplete-valuation state rather than a misleading total.
- Changing locale or display currency does not rewrite historical trades, prices, or portfolio returns.
- Harper’s personality appears in narrative conclusions, not in warnings, settings, or errors.
- The interface remains usable with different number formats, longer translations, and daylight-saving changes.

---

## 25. Recommended final section names

1. **Today**
2. **Investments**
3. **Performance**
4. **Portfolio mix**
5. **Ideas Harper reviewed**
6. **How Harper works**
7. **Decisions and research**
8. **Data status**
9. **Harper’s operating cost**
10. **Settings**

This structure keeps Harper’s voice where it adds value while making the dashboard portable across users, currencies, markets, benchmarks, and source ecosystems.
