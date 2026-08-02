# Dashboard Deployment

Deploying the dashboard is optional and must not block Harper's local setup.
The user should authorize every cloud resource and the first full sync.

## Accounts

You need:

- a Vercel account;
- a Convex account;
- a GitHub, GitLab, or Bitbucket account when using Git-based deployments.

Use browser or CLI sign-in. Do not provide account passwords or access tokens
to Harper in chat.

## Recommended: Vercel with the Convex integration

1. Import or clone this repository into a new Vercel project.
2. Install the Convex integration from the Vercel Marketplace and connect a new
   Convex project owned by your account.
3. Keep the integration's custom environment-variable prefix empty and enable
   its Production environment.
4. Confirm the build command is
   `npx convex deploy --cmd 'npm run build'`.
5. Deploy and confirm the dashboard opens using your new Convex deployment.

The integration supplies the Convex deployment credentials to Vercel. It does
not configure the private Harper-to-dashboard sync token.

## Alternative: Vercel Deploy Button

Use the Deploy Button in [README.md](README.md) to import this repository into
your Vercel account. The button asks for `CONVEX_DEPLOY_KEY`, so complete the
manual Convex connection below before the first successful production deploy.

## Manual Convex connection

1. Create a Convex project and production deployment.
2. Generate a production deploy key with `deployment:deploy` permission.
3. Add it to Vercel as `CONVEX_DEPLOY_KEY` for Production only.
4. Deploy with the build command already configured in `vercel.json`.

The deploy key belongs only in Vercel. Do not store it in this repository or in
the Hermes skill.

## Connect Harper securely

1. Generate a unique random token containing at least 32 characters.
2. In the production Convex deployment settings, create the environment
   variable `HARPER_SYNC_TOKEN` with that token.
3. In `~/.hermes/.env` on the machine running Harper, set:

```dotenv
CONVEX_URL=https://your-deployment.convex.cloud
HARPER_SYNC_URL=https://your-deployment.convex.site/harper-sync
HARPER_SYNC_TOKEN=your-unique-random-token
```

These values are examples of the required shapes. Use the Cloud URL and Site
URL shown by your own Convex production deployment. Never commit the completed
file or paste the token into chat.

4. From the installed `harper` skill directory, inspect the connection without
   exposing the token:

```bash
python3 scripts/portfolio.py dashboard --guide
```

5. After reviewing the exact production deployment and approving the initial
   read-model replacement, run:

```bash
python3 scripts/portfolio.py convex-sync
```

The first sync replaces the dashboard read model. Review the exact production
deployment and explicitly approve that replacement before running it.

## Updates

Git-connected Vercel projects deploy updates from their configured production
branch. Before syncing a payload introduced by a newer skill release, deploy a
dashboard release supporting the same dashboard contract version.

Never use dashboard data to reconstruct a missing SQLite ledger.
