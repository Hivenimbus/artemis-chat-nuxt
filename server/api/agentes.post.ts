<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, inboxAgents } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes
import { signInviteToken } from '~/server/utils/jwt'
import { sendEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)
    const { name, email, role, inbox_ids } = body

    if (!name || !email || !role) throw createError({ statusCode: 400, statusMessage: 'Dados incompletos' })

<<<<<<< Updated upstream
    // Buscar empresa do usuário criador
    const creatorData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!creatorData?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa' })
    }

    // Verificar se email já existe
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(r => r[0])
=======
    const [creatorData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!creatorData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa' })

    // Verificar se email já existe
    const [existingUser] = await db.select({ id: schema.users.id })
      .from(schema.users).where(eq(schema.users.email, email)).limit(1)
>>>>>>> Stashed changes

    if (existingUser) throw createError({ statusCode: 400, statusMessage: 'Email já cadastrado' })

    // Criar usuário com status pending
<<<<<<< Updated upstream
    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        role,
        empresa_id: creatorData.empresa_id,
        status: 'pending',
        invited_by: user.id,
        invited_at: new Date().toISOString()
      })
      .returning()
      .then(r => r[0])

    if (!newUser) {
      console.error('Erro ao criar agente')
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar agente' })
    }
=======
    const [newUser] = await db.insert(schema.users).values({
      name,
      email,
      role,
      empresa_id: creatorData.empresa_id,
      status: 'pending',
      invited_by: user.id,
      invited_at: new Date()
    }).returning()

    if (!newUser) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar agente' })
>>>>>>> Stashed changes

    // Associar caixas de entrada
    if (inbox_ids && Array.isArray(inbox_ids) && inbox_ids.length > 0) {
<<<<<<< Updated upstream
      const inboxAgentsValues = inbox_ids.map((inboxId: string) => ({
        user_id: newUser.id,
        inbox_id: inboxId
      }))

      try {
        await db.insert(inboxAgents).values(inboxAgentsValues)
      } catch (inboxError) {
        console.error('Erro ao associar inboxes:', inboxError)
        // Não falhar a criação do usuário, mas logar erro
      }
=======
      await db.insert(schema.inboxAgents).values(
        inbox_ids.map((inboxId: string) => ({ user_id: newUser.id, inbox_id: inboxId }))
      ).onConflictDoNothing()
>>>>>>> Stashed changes
    }

    // Gerar token de convite
    const inviteToken = signInviteToken({
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      empresa_id: newUser.empresa_id
    })

    const config = useRuntimeConfig()
    const inviteUrl = `${config.public.siteUrl}/convite?token=${inviteToken}`

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Olá ${name},</h2>
        <p>Você foi convidado para se juntar à equipe no MULTICONEX.</p>
        <p>Para aceitar o convite e definir sua senha, clique no botão abaixo:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Aceitar Convite
        </a>
        <p>Este link é válido por 24 horas.</p>
      </div>
    `

    await sendEmail(email, 'Convite para MULTICONEX', emailHtml)

    return { success: true, message: 'Convite enviado com sucesso', data: newUser }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
