import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { getHivePanelHeaders } from '~/server/lib/hive'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

  const [userData] = await db.select({ role: schema.users.role, empresa_id: schema.users.empresa_id })
    .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

  if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Sem empresa vinculada' })

  // Buscar todas as instâncias na Hive API
  let hiveInstances: any[] = []
  try {
    const headers = await getHivePanelHeaders()
    const res: any = await $fetch(`${config.hiveApiUrl}/api/instances`, {
      method: 'GET',
      headers
    })
    hiveInstances = Array.isArray(res) ? res : (res?.instances ?? res?.data ?? [])
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: `Erro ao buscar instâncias na Hive API: ${err.message}` })
  }

  // Buscar todas as inboxes da empresa
  const inboxes = await db.select({
    id: schema.inboxes.id,
    name: schema.inboxes.name,
    hive_instance_id: schema.inboxes.hive_instance_id
  }).from(schema.inboxes).where(eq(schema.inboxes.empresa_id, userData.empresa_id))

  const synced: string[] = []
  const skipped: string[] = []

  for (const instance of hiveInstances) {
    const hiveId: string = instance.id
    const hiveName: string = instance.name ?? ''

    // Tenta encontrar inbox cujo ID bate com o "name" da instância na Hive
    const inbox = inboxes.find(i => i.id === hiveName || i.hive_instance_id === hiveId)

    if (!inbox) {
      skipped.push(`${hiveName} (${hiveId}) — sem inbox correspondente`)
      continue
    }

    if (inbox.hive_instance_id === hiveId) {
      skipped.push(`${inbox.name} — já sincronizado`)
      continue
    }

    await db.update(schema.inboxes)
      .set({ hive_instance_id: hiveId, updated_at: new Date() })
      .where(eq(schema.inboxes.id, inbox.id))

    synced.push(`${inbox.name} (inbox ${inbox.id}) → hive_instance_id: ${hiveId}`)
  }

  return {
    success: true,
    hive_instances_found: hiveInstances.length,
    synced,
    skipped
  }
})
