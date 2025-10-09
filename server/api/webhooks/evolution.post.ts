/**
 * Webhook Endpoint: Evolution API Events
 * 
 * POST /api/webhooks/evolution
 * 
 * Receives and processes webhook events from Evolution API.
 * Handles QR code updates, connection state changes, incoming messages, etc.
 */

import type { EvolutionWebhookEvent } from '~/server/services/evolutionApi'

export default defineEventHandler(async (event) => {
  try {
    // Parse webhook payload
    const payload: EvolutionWebhookEvent = await readBody(event)
    
    console.log('Received Evolution webhook:', {
      event: payload.event,
      instance: payload.instance,
      timestamp: payload.date_time,
    })

    // Get Supabase admin client (no user auth needed for webhooks)
    const supabase = serverSupabaseServiceRole(event)

    // Extract instance name and find corresponding inbox
    const instanceName = payload.instance
    
    const { data: inbox, error } = await supabase
      .from('inboxes')
      .select('*')
      .eq('session_data->>instanceName', instanceName)
      .single()

    if (error || !inbox) {
      console.warn(`Inbox not found for instance: ${instanceName}`)
      return {
        success: false,
        message: 'Inbox not found',
      }
    }

    // Handle different event types
    switch (payload.event) {
      case 'QRCODE_UPDATED':
        await handleQRCodeUpdate(supabase, inbox, payload)
        break

      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(supabase, inbox, payload)
        break

      case 'MESSAGES_UPSERT':
        await handleNewMessage(supabase, inbox, payload)
        break

      case 'MESSAGES_UPDATE':
        await handleMessageUpdate(supabase, inbox, payload)
        break

      case 'MESSAGES_DELETE':
        await handleMessageDelete(supabase, inbox, payload)
        break

      default:
        console.log(`Unhandled event type: ${payload.event}`)
    }

    return {
      success: true,
      message: 'Webhook processed',
    }
  } catch (error: any) {
    console.error('Error processing Evolution webhook:', error)
    
    return {
      success: false,
      message: error.message,
    }
  }
})

/**
 * Handle QR code update events
 */
async function handleQRCodeUpdate(supabase: any, inbox: any, payload: EvolutionWebhookEvent) {
  const qrCodeData = payload.data?.qrcode

  if (qrCodeData?.base64) {
    await supabase
      .from('inboxes')
      .update({
        qr_code: qrCodeData.base64,
        session_data: {
          ...(inbox.session_data || {}),
          pairingCode: qrCodeData.pairingCode,
          lastQRUpdate: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', inbox.id)

    console.log(`Updated QR code for inbox ${inbox.id}`)
  }
}

/**
 * Handle connection state changes
 */
async function handleConnectionUpdate(supabase: any, inbox: any, payload: EvolutionWebhookEvent) {
  const state = payload.data?.state
  
  let status: 'connected' | 'disconnected' | 'connecting' = 'disconnected'
  
  if (state === 'open') {
    status = 'connected'
  } else if (state === 'connecting') {
    status = 'connecting'
  }

  await supabase
    .from('inboxes')
    .update({
      status,
      session_data: {
        ...(inbox.session_data || {}),
        connectionState: state,
        lastConnectionUpdate: new Date().toISOString(),
      },
      // Clear QR code when connected
      qr_code: status === 'connected' ? null : inbox.qr_code,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inbox.id)

  console.log(`Updated connection status for inbox ${inbox.id}: ${status}`)
}

/**
 * Handle new incoming messages
 * You can extend this to store messages in a separate table
 */
async function handleNewMessage(supabase: any, inbox: any, payload: EvolutionWebhookEvent) {
  const messageData = payload.data?.message || payload.data

  console.log(`New message for inbox ${inbox.id}:`, {
    from: messageData?.key?.remoteJid,
    messageType: messageData?.messageType,
  })

  // TODO: Store message in a messages table if needed
  // For now, just log the event
  
  // You could create a messages table and insert like this:
  // await supabase.from('messages').insert({
  //   inbox_id: inbox.id,
  //   from: messageData?.key?.remoteJid,
  //   message_type: messageData?.messageType,
  //   content: extractMessageContent(messageData),
  //   raw_data: messageData,
  //   created_at: new Date().toISOString(),
  // })
}

/**
 * Handle message update events (read receipts, delivery status, etc.)
 */
async function handleMessageUpdate(supabase: any, inbox: any, payload: EvolutionWebhookEvent) {
  console.log(`Message update for inbox ${inbox.id}`)
  // TODO: Update message status in messages table if you have one
}

/**
 * Handle message deletion events
 */
async function handleMessageDelete(supabase: any, inbox: any, payload: EvolutionWebhookEvent) {
  console.log(`Message deleted for inbox ${inbox.id}`)
  // TODO: Mark message as deleted in messages table if you have one
}
