import { db, schema } from '../database'
import { eq } from 'drizzle-orm'

async function promote() {
    console.log('Promoting all users to superadmin...')
    await db.update(schema.users).set({ role: 'superadmin' })
    console.log('Done!')
    process.exit(0)
}

promote().catch(console.error)
