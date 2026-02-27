import { eq, and, gte, lte } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

    const query = getQuery(event)
    const startDate = query.start_date as string
    const endDate = query.end_date as string
    const type = query.type as string
    const status = query.status as string

    const conditions: any[] = [eq(schema.agendamentos.empresa_id, userData.empresa_id)]
    if (startDate) conditions.push(gte(schema.agendamentos.start_time as any, new Date(startDate)))
    if (endDate) conditions.push(lte(schema.agendamentos.start_time as any, new Date(endDate)))
    if (type) conditions.push(eq(schema.agendamentos.type, type))
    if (status) conditions.push(eq(schema.agendamentos.status, status))

    const agendamentos = await db.query.agendamentos.findMany({
      where: and(...conditions),
      with: { contato: { columns: { id: true, nome: true, telefone: true } } }
    })

    return { success: true, data: agendamentos }

  } catch (error: any) {
    console.error('API agendamentos/index.get:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao buscar agendamentos' })
  }
})
