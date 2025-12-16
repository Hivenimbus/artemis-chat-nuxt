import { createServiceSupabaseClient } from './evolution'

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
  const client = createServiceSupabaseClient()
  
  let empresaId = params.empresaId
  
  // If empresaId not provided, fetch from user
  if (!empresaId) {
    const { data: user, error } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', params.userId)
      .single()
      
    if (error || !user) {
      console.error('Error fetching user for notification:', error)
      return { success: false, error }
    }
    
    empresaId = user.empresa_id
  }
  
  if (!empresaId) {
    console.error('User has no empresa_id for notification')
    return { success: false, error: 'User has no empresa_id' }
  }

  const { data, error } = await client
    .from('notifications')
    .insert({
      user_id: params.userId,
      empresa_id: empresaId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      metadata: params.metadata || {},
      read: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

