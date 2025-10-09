/**
 * API Endpoint: Disconnect Evolution WhatsApp Instance
 * 
 * POST /api/evolution/disconnect
 * 
 * Disconnects and deletes a WhatsApp instance from Evolution API
 */

import { useEvolutionApi } from '~/server/services/evolutionApi'

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Parse request body
    const body = await readBody(event)
    const { inboxId } = body

    if (!inboxId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: inboxId',
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

    // Get instance name from session data
    const sessionData = inbox.session_data as any
    if (!sessionData?.instanceName) {
      return {
        success: true,
        message: 'Inbox already disconnected',
      }
    }

    // Disconnect from Evolution API
    const evolutionApi = useEvolutionApi(event)
    
    try {
      // First try to logout (graceful disconnect)
      await evolutionApi.logoutInstance(sessionData.instanceName)
      
      // Then delete the instance
      await evolutionApi.deleteInstance(sessionData.instanceName)
    } catch (apiError: any) {
      console.warn(`Failed to disconnect instance ${sessionData.instanceName}:`, apiError.message)
      // Continue to update Supabase even if Evolution API fails
    }

    // Update inbox in Supabase
    const { data: updatedInbox, error: updateError } = await supabase
      .from('inboxes')
      .update({
        status: 'disconnected',
        whatsapp_phone: null,
        qr_code: null,
        session_data: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inboxId)
      .select()
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update inbox: ${updateError.message}`,
      })
    }

    return {
      success: true,
      inbox: updatedInbox,
      message: 'WhatsApp instance disconnected successfully',
    }
  } catch (error: any) {
    console.error('Error disconnecting Evolution instance:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to disconnect WhatsApp instance',
    })
  }
})
