import { defineApp } from 'convex/server'
import { v } from 'convex/values'

const app = defineApp({
  env: {
    HARPER_SYNC_TOKEN: v.optional(v.string())
  }
})

export default app
