import { httpRouter } from 'convex/server'
import { env, httpAction } from './_generated/server'
import { internal } from './_generated/api'

const http = httpRouter()
const encoder = new TextEncoder()

async function tokenMatches(provided: string, expected: string) {
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected))
  ])
  const left = new Uint8Array(providedHash)
  const right = new Uint8Array(expectedHash)
  let mismatch = left.length ^ right.length
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    mismatch |= left[index]! ^ right[index]!
  }
  return mismatch === 0
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
}

http.route({
  path: '/harper-sync',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const expectedToken = (env as Record<string, string | undefined>).HARPER_SYNC_TOKEN
    if (!expectedToken || expectedToken.length < 32) {
      return jsonResponse(503, {
        error: 'Harper dashboard sync is not configured'
      })
    }

    const authorization = request.headers.get('Authorization') ?? ''
    const providedToken = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : ''
    if (!providedToken || !(await tokenMatches(providedToken, expectedToken))) {
      return jsonResponse(401, { error: 'Unauthorized' })
    }

    let body: { contractVersion?: unknown, payload?: unknown }
    try {
      body = await request.json()
    } catch {
      return jsonResponse(400, { error: 'Request body must be valid JSON' })
    }

    if (body.contractVersion !== 2 || !body.payload || typeof body.payload !== 'object') {
      return jsonResponse(400, {
        error: 'Unsupported or missing Harper dashboard contract version'
      })
    }

    try {
      const result = await ctx.runMutation(
        internal.sync.syncDashboard,
        body.payload as never
      )
      return jsonResponse(200, result)
    } catch (error) {
      console.error('Harper dashboard sync failed', error)
      return jsonResponse(400, { error: 'Dashboard payload was rejected' })
    }
  })
})

export default http
