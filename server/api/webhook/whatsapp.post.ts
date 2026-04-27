import { processHiveMessage } from '~/server/lib/hive'
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const body = await readBody(event)

    // Log completo para diagnóstico
    console.log('[webhook] payload recebido:', JSON.stringify(body, null, 2))

    // Hive API envia instance_id (UUID), não "instance"
    const hiveInstanceId: string = body.instance_id || body.instance || ''
    const eventName: string = body.event || ''

    console.log(`[webhook] evento=${eventName} | hive_instance_id=${hiveInstanceId}`)

    if (eventName === 'message.received') {
      await processHiveMessage(body)
    }
    else if (eventName === 'connection.connected') {
      const phone = body.data?.phone ?? body.data?.phoneNumber ?? null
      try {
        await db.update(schema.inboxes)
          .set({ status: 'connected', phone_number: phone, updated_at: new Date() })
          .where(eq(schema.inboxes.hive_instance_id, hiveInstanceId))
      } catch (e) {
        console.error('Erro ao atualizar status connected:', e)
      }
    }
    else if (eventName === 'connection.disconnected' || eventName === 'connection.logged_out') {
      try {
        await db.update(schema.inboxes)
          .set({ status: 'disconnected', updated_at: new Date() })
          .where(eq(schema.inboxes.hive_instance_id, hiveInstanceId))
      } catch (e) {
        console.error('Erro ao atualizar status disconnected:', e)
      }
    }
    else {
      console.log('[webhook] Evento não processado:', eventName)
    }

    return {
      success: true,
      event: eventName,
      processingTime: `${Date.now() - startTime}ms`
    }
  } catch (error: any) {
    console.error('[webhook] Erro:', error)
    // Sempre retorna 200 para não bloquear a Hive API
    return {
      success: false,
      error: error.message,
      processingTime: `${Date.now() - startTime}ms`
    }
  }
})
