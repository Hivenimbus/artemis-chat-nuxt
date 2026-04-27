import { eq } from 'drizzle-orm'
import QRCode from 'qrcode'
import { db, schema } from '~/server/database'
import { getHivePanelHeaders } from '~/server/lib/hive'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID da caixa de entrada é obrigatório' })
    }

    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Erro ao verificar permissões do usuário' })
    }

    const [inbox] = await db.select().from(schema.inboxes)
      .where(eq(schema.inboxes.id, id))
      .limit(1)

    if (!inbox || inbox.empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Caixa de entrada não encontrada ou sem permissão' })
    }

    const hiveId = inbox.hive_instance_id
    if (!hiveId) {
      throw createError({ statusCode: 400, statusMessage: 'Caixa de entrada sem instância Hive vinculada. Delete e recrie a caixa de entrada.' })
    }

    const panelHeaders = await getHivePanelHeaders()

    // Iniciar conexão na Hive API
    try {
      await $fetch(`${config.hiveApiUrl}/api/instances/${hiveId}/connect`, {
        method: 'POST',
        headers: panelHeaders
      })
    } catch (connectError: any) {
      console.warn('⚠️ Aviso ao iniciar conexão (pode já estar conectado):', connectError.message)
    }

    // Conectar no SSE stream da Hive API e aguardar evento qr ou connected
    const sseUrl = `${config.hiveApiUrl}/api/instances/${hiveId}/qr/stream`

    const result = await new Promise<{ base64: string | null, status: string, phone: string | null }>(
      async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout aguardando QR Code da Hive API (15s)'))
        }, 15000)

        try {
          const res = await fetch(sseUrl, {
            headers: panelHeaders
          })

          if (!res.ok || !res.body) {
            clearTimeout(timeout)
            reject(new Error(`Hive API SSE retornou status ${res.status}`))
            return
          }

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let currentEvent = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim()
              } else if (line.startsWith('data:')) {
                const rawData = line.slice(5).trim()
                let parsed: any = {}
                try { parsed = JSON.parse(rawData) } catch { parsed = { value: rawData } }

                if (currentEvent === 'qr') {
                  clearTimeout(timeout)
                  reader.cancel()
                  const qrString = parsed.qr ?? parsed.value ?? rawData
                  const base64 = await QRCode.toDataURL(qrString)
                  resolve({ base64, status: 'connecting', phone: null })
                  return
                }

                if (currentEvent === 'connected') {
                  clearTimeout(timeout)
                  reader.cancel()
                  const phone = parsed.phone ?? parsed.number ?? null
                  await db.update(schema.inboxes)
                    .set({ status: 'connected', updated_at: new Date() })
                    .where(eq(schema.inboxes.id, id))
                  resolve({ base64: null, status: 'connected', phone })
                  return
                }

                if (currentEvent === 'error') {
                  clearTimeout(timeout)
                  reader.cancel()
                  reject(new Error(parsed.message ?? 'Erro no SSE da Hive API'))
                  return
                }

                currentEvent = ''
              }
            }
          }
        } catch (err: any) {
          clearTimeout(timeout)
          reject(err)
        }
      }
    )

    return { success: true, data: result }

  } catch (error: any) {
    console.error('Erro no handler de QR Code:', error)

    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao buscar QR Code. Tente novamente em instantes.'
    })
  }
})
