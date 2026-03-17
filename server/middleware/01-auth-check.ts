import { eq } from 'drizzle-orm'
import { verifyUserToken, signUserToken } from '~/server/utils/jwt'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')

  if (token) {
    const user = verifyUserToken(token)
    if (user) {
      // JWT antigo não tem name ou empresa_id — renovar silenciosamente
      if (!user.name || !user.empresa_id) {
        try {
          const [dbUser] = await db
            .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role, name: schema.users.name, empresa_id: schema.users.empresa_id })
            .from(schema.users)
            .where(eq(schema.users.id, user.id))
            .limit(1)

          if (dbUser) {
            user.name = dbUser.name || undefined
            user.empresa_id = dbUser.empresa_id || undefined

            // Renovar o cookie com JWT atualizado
            const newToken = signUserToken({
              id: dbUser.id,
              email: dbUser.email!,
              role: dbUser.role,
              name: dbUser.name || undefined,
              empresa_id: dbUser.empresa_id || undefined,
            })
            setCookie(event, 'auth_token', newToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
              sameSite: 'lax'
            })
          }
        } catch {
          // silencioso — não impede o request
        }
      }

      event.context.user = user
    }
  }
})
