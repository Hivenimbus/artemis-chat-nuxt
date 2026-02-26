<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, agendamentos, agendamentoContatos, contatos } from '~/server/db/schema'
import { eq, and, gte, lte, inArray, asc } from 'drizzle-orm'
=======
import { eq, and, gte, lte } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

<<<<<<< Updated upstream
    // Get user data to find empresa_id
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // Get query params
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

>>>>>>> Stashed changes
    const query = getQuery(event)
    const startDate = query.start_date as string
    const endDate = query.end_date as string
    const type = query.type as string
    const status = query.status as string

<<<<<<< Updated upstream
    // Build conditions
    const conditions = [eq(agendamentos.empresa_id, userData.empresa_id)]

    if (startDate) {
      conditions.push(gte(agendamentos.start_time, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(agendamentos.start_time, new Date(endDate)))
    }
    if (type) {
      conditions.push(eq(agendamentos.type, type))
    }
    if (status) {
      conditions.push(eq(agendamentos.status, status))
    }

    // Fetch agendamentos
    const schedules = await db
      .select()
      .from(agendamentos)
      .where(and(...conditions))
      .orderBy(asc(agendamentos.start_time))

    // Fetch related contacts separately
    if (schedules.length > 0) {
      const scheduleIds = schedules.map(a => a.id)

      const contactLinks = await db
        .select({
          agendamento_id: agendamentoContatos.agendamento_id,
          contato_id: agendamentoContatos.contato_id,
          nome: contatos.nome,
          sobrenome: contatos.sobrenome,
          telefone: contatos.telefone,
          email: contatos.email
        })
        .from(agendamentoContatos)
        .innerJoin(contatos, eq(agendamentoContatos.contato_id, contatos.id))
        .where(inArray(agendamentoContatos.agendamento_id, scheduleIds))

      // Group contact links by agendamento_id
      const contactsBySchedule: Record<string, typeof contactLinks> = {}
      for (const link of contactLinks) {
        if (!contactsBySchedule[link.agendamento_id]) {
          contactsBySchedule[link.agendamento_id] = []
        }
        contactsBySchedule[link.agendamento_id].push(link)
      }

      // Merge contacts into agendamentos
      const result = schedules.map(schedule => ({
        ...schedule,
        agendamento_contatos: (contactsBySchedule[schedule.id] || []).map(link => ({
          contato_id: link.contato_id,
          contatos: {
            id: link.contato_id,
            nome: link.nome,
            sobrenome: link.sobrenome,
            telefone: link.telefone,
            email: link.email
          }
        }))
      }))

      return {
        success: true,
        data: result
      }
    }

    return {
      success: true,
      data: schedules.map(schedule => ({ ...schedule, agendamento_contatos: [] }))
    }

  } catch (error) {
=======
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
>>>>>>> Stashed changes
    console.error('API agendamentos/index.get:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao buscar agendamentos' })
  }
})
