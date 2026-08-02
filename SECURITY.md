# Security

## Credential boundaries

- `CONVEX_DEPLOY_KEY` belongs in Vercel and should be scoped to deployment.
- `HARPER_SYNC_TOKEN` belongs in the Convex deployment environment and the
  local Hermes environment.
- `CONVEX_URL` is public configuration, not a credential.
- Vercel, Convex, and Git-provider passwords or access tokens must never be
  committed or pasted into agent conversations.

The sync HTTP action rejects requests when `HARPER_SYNC_TOKEN` is absent,
shorter than 32 characters, or does not match the bearer token. The full
replacement mutation is internal and cannot be invoked directly by clients.

## Rotation

To rotate the sync credential, update `HARPER_SYNC_TOKEN` in Convex first and
then update the local Hermes environment before the next sync. A sync failure
does not alter or roll back the local SQLite ledger.

## Reporting a vulnerability

Open a private security advisory in the GitHub repository. Do not include live
tokens, deployment keys, portfolio exports, or other users' data in the report.
