import { db } from '~/server/db'
import { users, inboxAgents } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { signInviteToken } from '~/server/utils/jwt'
import { sendEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)
    const { name, email, role, inbox_ids } = body

    if (!name || !email || !role) {
      throw createError({ statusCode: 400, statusMessage: 'Dados incompletos' })
    }

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

    if (existingUser) {
      throw createError({ statusCode: 400, statusMessage: 'Email já cadastrado' })
    }

    // Criar usuário com status pending
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

    // Associar caixas de entrada se fornecidas
    if (inbox_ids && Array.isArray(inbox_ids) && inbox_ids.length > 0) {
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
    }

    // Gerar token de convite
    const inviteToken = signInviteToken({
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      empresa_id: newUser.empresa_id
    })

    // URL do convite
    const config = useRuntimeConfig()
    const inviteUrl = `${config.public.siteUrl}/convite?token=${inviteToken}`

    // Enviar email
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Olá ${name},</h2>
        <p>Você foi convidado para se juntar à equipe no MULTICONEX.</p>
        <p>Para aceitar o convite e definir sua senha, clique no botão abaixo:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Aceitar Convite
        </a>
        <p>Este link é válido por 24 horas.</p>
        <p>Se você não esperava este convite, pode ignorar este email.</p>
      </div>
    `

    await sendEmail(email, 'Convite para MULTICONEX', emailHtml)

    return { success: true, message: 'Convite enviado com sucesso', data: newUser }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
