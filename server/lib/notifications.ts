import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export type NotificationType = 'reminder' | 'campaign' | 'system'

export interface CreateNotificationParams {
  userId: string
  empresaId?: string
  title: string
  message: string
  type: NotificationType
  link?: string
  metadata?: any
}

export async function createNotification(params: CreateNotificationParams) {
  let empresaId = params.empresaId

  if (!empresaId) {
    const [user] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, params.userId)).limit(1)

    if (!user) {
      console.error('Error fetching user for notification: user not found')
      return { success: false, error: 'User not found' }
    }

    empresaId = user.empresa_id ?? undefined
  }

  if (!empresaId) {
    console.error('User has no empresa_id for notification')
    return { success: false, error: 'User has no empresa_id' }
  }

  try {
    const [data] = await db.insert(schema.notifications).values({
      user_id: params.userId,
      empresa_id: empresaId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link || null,
      metadata: params.metadata || {},
      read: false
    }).returning()

    return { success: true, data }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}
