/**
 * API Endpoint: Create Evolution WhatsApp Instance
 * 
 * POST /api/evolution/create-instance
 * 
 * Creates a new WhatsApp instance using Evolution API and stores it in Supabase.
 * Returns the instance details including QR code for user scanning.
 */

import { useEvolutionApi, getDefaultWebhookEvents } from '~/server/services/evolutionApi'

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user from session
    const user = await getServerUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - User not authenticated',
      })
    }

    // Parse request body
    const body = await readBody(event)
    const { inboxId, name, phone } = body

    if (!inboxId || !name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: inboxId and name',
      })
    }

    // Generate unique instance name
    const instanceName = `inbox_${inboxId}_${Date.now()}`

    // Get webhook URL from config (your Nuxt app URL + webhook endpoint)
    const config = useRuntimeConfig(event)
    const webhookUrl = `${config.public.siteUrl || 'http://localhost:3000'}/api/webhooks/evolution`

    // Initialize Evolution API client
    const evolutionApi = useEvolutionApi(event)

    console.log('Creating instance:', { instanceName, phone })

    // Create instance with Evolution API - using minimal required fields
    // Webhook will be configured separately after instance creation
    const instanceData = await evolutionApi.createInstance({
      instanceName,
      qrcode: true,  // Request QR code
      integration: 'WHATSAPP-BAILEYS', // Use Baileys (WhatsApp Web)
    })

    console.log('Instance created, configuring webhook events...')

    // Configure webhook events after instance creation
    try {
      await evolutionApi.setWebhook(
        instanceName,
        webhookUrl,
        getDefaultWebhookEvents(),
        false // Don't split by events
      )
      console.log('Webhook events configured successfully')
    } catch (webhookError) {
      console.warn('Failed to configure webhook events:', webhookError)
      // Continue anyway, as the webhook URL is already set
    }

    // Update inbox in Supabase with instance details
    const supabase = await useSupabaseServer(event)
    
    console.log('Updating inbox in Supabase:', { inboxId, hasQrCode: !!instanceData.qrcode?.base64 })
    
    const { data: updatedInbox, error } = await supabase
      .from('inboxes')
      .update({
        // phone_number will be updated later via webhook when connection is established
        qr_code: instanceData.qrcode?.base64 || null,
        session_data: {
          instanceName,
          status: instanceData.instance.status,
          pairingCode: instanceData.qrcode?.pairingCode,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', inboxId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      // If Supabase update fails, try to clean up Evolution instance
      try {
        await evolutionApi.deleteInstance(instanceName)
      } catch (cleanupError) {
        console.error('Failed to cleanup Evolution instance:', cleanupError)
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update inbox: ${error.message}`,
      })
    }

    return {
      success: true,
      inbox: updatedInbox,
      instance: {
        name: instanceName,
        status: instanceData.instance.status,
        qrCode: instanceData.qrcode?.base64,
        pairingCode: instanceData.qrcode?.pairingCode,
      },
    }
  } catch (error: any) {
    console.error('Error creating Evolution instance:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to create WhatsApp instance',
    })
  }
})
