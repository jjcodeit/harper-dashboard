import fs from 'node:fs'
import path from 'node:path'

const required = {
  'convex/schema.ts': [
    'decision_model_version', 'parameter_version', 'schedule_version',
    'thesis_type', 'investment_success_probability', 'expected_return_pct',
    'scenario_json', 'thesis_contract_json', 'hard_gates_json',
    'score_components_json', 'weighted_score', 'shadow_recommendation'
  ],
  'convex/sync.ts': [
    'internalMutation', 'decision_model_version', 'parameter_version',
    'schedule_version', 'investment_success_probability', 'expected_return_pct',
    'scenario_json', 'thesis_contract_json', 'hard_gates_json',
    'score_components_json', 'weighted_score', 'shadow_recommendation',
    'contractVersion: v.literal(2)', 'dashboard_profile', 'market_adapter',
    'portfolio_config', 'valuation', 'sync_metadata'
  ],
  'convex/http.ts': [
    'path: \'/harper-sync\'', 'HARPER_SYNC_TOKEN',
    'Authorization', 'internal.sync.syncDashboard', 'contractVersion !== 2'
  ],
  'convex/dashboard.ts': [
    'operating_schedule', 'portfolio_config', 'market_adapter', 'valuation',
    'investment_success_probability', 'expected_return_pct',
    'scenario_json', 'thesis_contract_json', 'hard_gates_json',
    'score_components_json', 'weighted_score', 'shadow_recommendation'
  ],
  'app/components/DashboardHowHarperWorks.vue': [
    'How Harper works', 'Reliable evidence', 'Enough potential upside',
    'Clear risk limit', 'Current market data', 'Portfolio fit'
  ],
  'app/pages/index.vue': [
    'DashboardHowHarperWorks', ':schedule="data?.operating_schedule"',
    'convexClient.action(api.getPrices.getLivePrices'
  ],
  'nuxt.config.ts': [
    'process.env.NUXT_PUBLIC_CONVEX_URL', 'process.env.CONVEX_URL'
  ],
  'vercel.json': ['npx convex deploy --cmd \'npm run build\'']
}

const failures = []
for (const [file, tokens] of Object.entries(required)) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}: missing file`)
    continue
  }
  const text = fs.readFileSync(file, 'utf8')
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${file}: missing ${token}`)
  }
}

const scheduleSource = fs.readFileSync('convex/dashboard.ts', 'utf8')
if (scheduleSource.includes('timezone: \'Asia/Kolkata\'')) {
  failures.push('convex/dashboard.ts: operating schedule must come from the market adapter')
}

const forbiddenPaths = [
  'app/pages/widget.vue',
  'server/api/generate.post.ts',
  'app/components/WidgetConfig.vue',
  'app/components/WidgetPreview.vue'
]
for (const file of forbiddenPaths) {
  if (fs.existsSync(file)) failures.push(`${file}: unrelated widget code must not ship`)
}

const sourceExtensions = new Set(['.ts', '.vue', '.js', '.mjs', '.json'])
const ignoredDirectories = new Set(['.git', '.nuxt', '.output', 'node_modules'])
const unrelatedCredentialNames = ['OPENROUTER', 'OPENCODE', 'OPENAI', 'GEMINI']
  .map(provider => `${provider}_API_KEY`)
const sourceFiles = []
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(entryPath)
    else if (sourceExtensions.has(path.extname(entry.name))) sourceFiles.push(entryPath)
  }
}
walk('.')

for (const file of sourceFiles) {
  if (file === 'scripts/validate-release-contract.mjs') continue
  const text = fs.readFileSync(file, 'utf8')
  if (/https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)?\.convex\.cloud/i.test(text)) {
    failures.push(`${file}: hardcoded Convex deployment URL`)
  }
  if (unrelatedCredentialNames.some(name => text.includes(name))) {
    failures.push(`${file}: unrelated model-provider credential surface`)
  }
}

if (failures.length) {
  console.error('Release contract validation failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Release contract validation passed.')
