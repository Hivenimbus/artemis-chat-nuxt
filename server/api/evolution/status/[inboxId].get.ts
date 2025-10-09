/**
 * API Endpoint: Get Evolution Instance Status
 * 
 * GET /api/evolution/status/:inboxId
 * 
 * Fetches the current connection status of a WhatsApp instance
 */

import { useEvolutionApi } from '~/server/services/evolutionApi'

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user
    const user = await getServerUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - User not authenticated',
      })
    }

    // Get inbox ID from route params
    const inboxId = getRouterParam(event, 'inboxId')
    if (!inboxId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing inboxId parameter',
      })
    }

    // Fetch inbox from Supabase
    const supabase = await useSupabaseServer(event)
    const { data: inbox, error } = await supabase
      .from('inboxes')
      .select('*')
      .eq('id', inboxId)
      .eq('user_id', user.id)
      .single()

    if (error || !inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Inbox not found',
      })
    }

    // Check if instance exists
    const sessionData = inbox.session_data as any
    if (!sessionData?.instanceName) {
      return {
        success: true,
        status: 'not_connected',
        inbox,
      }
    }

    // Get status from Evolution API
    const evolutionApi = useEvolutionApi(event)
    
    try {
      const connectionState = await evolutionApi.fetchInstance(sessionData.instanceName)
      
      // Update inbox status if changed
      if (connectionState.state !== inbox.status) {
        const { data: updatedInbox } = await supabase
          .from('inboxes')
          .update({
            status: connectionState.state === 'open' ? 'connected' : 'disconnected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', inboxId)
          .select()
          .single()
        
        return {
          success: true,
          status: connectionState.state,
          inbox: updatedInbox || inbox,
        }
      }

      return {
        success: true,
        status: connectionState.state,
        inbox,
      }
    } catch (apiError: any) {
      // If instance doesn't exist in Evolution API, mark as disconnected
      console.warn(`Instance ${sessionData.instanceName} not found in Evolution API`)
      
      await supabase
        .from('inboxes')
        .update({
          status: 'disconnected',
          session_data: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inboxId)

      return {
        success: true,
        status: 'not_found',
        inbox,
      }
    }
  } catch (error: any) {
    console.error('Error fetching Evolution instance status:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch instance status',
    })
  }
})
