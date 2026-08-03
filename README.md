# Harper Dashboard

The official optional web dashboard for the
[Virtual Investor — Harper](https://github.com/balsimpson/virtual-investor)
Hermes skill. It presents Harper's local portfolio ledger as a private,
replaceable read model using Nuxt 4, Nuxt UI, Convex, and Vercel.

Harper works without this dashboard. SQLite on the Hermes machine remains the
source of truth; Convex is never a backup or recovery source.

## Deploy for personal use

[![Deploy Harper Dashboard with Vercel](https://vercel.com/button)](https://vercel.com/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbalsimpson%2Fharper-dashboard&project-name=harper-dashboard&repository-name=harper-dashboard&env=CONVEX_DEPLOY_KEY&envDescription=Add%20a%20production-scoped%20Convex%20deploy%20key%20for%20this%20dashboard.&envLink=https%3A%2F%2Fdocs.convex.dev%2Fproduction%2Fhosting%2Fvercel)

The button imports this repository into Vercel and uses the manual
`CONVEX_DEPLOY_KEY` connection. If you prefer Vercel to create and connect the
Convex project for you, use the recommended Marketplace path in
[DEPLOYMENT.md](DEPLOYMENT.md).

Both paths deploy into accounts you control. Neither path uploads portfolio
data; connecting Harper and approving the first sync are separate steps.

## What gets deployed

- A Nuxt dashboard on Vercel.
- A Convex backend containing the dashboard schema and queries.
- An authenticated `/harper-sync` HTTP endpoint for the local Hermes skill.

Each installation must use its own Convex deployment and its own sync token.
No deployment URLs, portfolio data, tokens, or provider credentials are
included in this repository.

After deployment, follow the short **Connect Harper securely** section in
[DEPLOYMENT.md](DEPLOYMENT.md). From the installed Harper directory, this
command shows which settings remain without exposing the sync token:

```bash
python3 scripts/portfolio.py dashboard --guide
```

## Deployment details

Follow [DEPLOYMENT.md](DEPLOYMENT.md). The recommended path uses Vercel's
Convex Marketplace integration. The manual path uses a production-scoped
`CONVEX_DEPLOY_KEY` with only the permissions needed to deploy the backend.

The Vercel build command is already defined as:

```bash
npx convex deploy --cmd 'npm run build'
```

After deployment, create `HARPER_SYNC_TOKEN` in the production Convex
deployment and store the same value in the Hermes runtime environment. Never
paste it into a chat or commit it.

## Run locally for development

```bash
npm install
npx convex dev
npm run dev
```

`npx convex dev` creates or selects the development deployment and writes its
URL to the local environment. The Nuxt app reads `NUXT_PUBLIC_CONVEX_URL` first
and falls back to `CONVEX_URL` during deployment builds.

Run focused verification with:

```bash
npm run validate:contract
npm run typecheck
npm run lint
```

## Repository relationship

The companion
[virtual-investor repository](https://github.com/balsimpson/virtual-investor)
owns Harper's policy, portfolio engine, SQLite ledger, dashboard contract
version, and sync payload. This repository consumes that payload and owns the
matching Convex schema, authenticated sync endpoint, read queries, and Nuxt UI.

When changing the integration, review these files together:

- `virtual-investor/skills/harper/scripts/portfolio.py` and
  `virtual-investor/skills/harper/references/dashboard-operations.md`
- `convex/schema.ts`, `convex/sync.ts`, `convex/http.ts`, and
  `convex/dashboard.ts` in this repository
- contract and regression checks in both repositories

Keep both projects on the same dashboard contract version. Deploy the compatible
dashboard backend before sending a new payload, and never infer permission to
run `convex-sync`: it replaces the Convex read model and requires approval of
the exact deployment target.

## Security

Portfolio replacement is not exposed as a public Convex mutation. The public
HTTP endpoint requires a bearer token and calls an internal mutation only after
authentication and contract-version validation. See [SECURITY.md](SECURITY.md)
for credential handling and reporting guidance.

## License

[MIT](LICENSE)

