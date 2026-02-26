import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// Use lazy singleton to avoid creating multiple connections during SSR/HMR
let _db: ReturnType<typeof drizzle> | null = null
let _client: ReturnType<typeof postgres> | null = null

function getDb() {
    if (!_db) {
        const databaseUrl = process.env.DATABASE_URL
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set')
        }
        _client = postgres(databaseUrl, { ssl: 'require' })
        _db = drizzle(_client, { schema })
    }
    return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_target, prop) {
        return getDb()[prop as keyof ReturnType<typeof drizzle>]
    }
})

export { schema }
