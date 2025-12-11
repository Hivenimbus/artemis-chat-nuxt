import { serverSupabaseServiceRole } from '#supabase/server'
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

    const client = serverSupabaseServiceRole(event)

    // Buscar empresa do usuário criador
    const { data: creatorData } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!creatorData?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa' })
    }

    // Verificar se email já existe
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw createError({ statusCode: 400, statusMessage: 'Email já cadastrado' })
    }

    // Criar usuário com status pending
    const { data: newUser, error } = await client
      .from('users')
      .insert({
        name,
        email,
        role,
        empresa_id: creatorData.empresa_id,
        status: 'pending',
        invited_by: user.id,
        invited_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar agente:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar agente' })
    }

    // Associar caixas de entrada se fornecidas
    if (inbox_ids && Array.isArray(inbox_ids) && inbox_ids.length > 0) {
      const inboxAgents = inbox_ids.map((inboxId: string) => ({
        user_id: newUser.id,
        inbox_id: inboxId
      }))
      
      const { error: inboxError } = await client
        .from('inbox_agents')
        .insert(inboxAgents)

      if (inboxError) {
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
        <p>Você foi convidado para se juntar à equipe no Artemis Chat.</p>
        <p>Para aceitar o convite e definir sua senha, clique no botão abaixo:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Aceitar Convite
        </a>
        <p>Este link é válido por 24 horas.</p>
        <p>Se você não esperava este convite, pode ignorar este email.</p>
      </div>
    `

    // Enviar email em background para não travar a request se demorar
    // Mas aguardar erro se for crítico? O ideal é usar fila, mas aqui vamos await para feedback imediato
    await sendEmail(email, 'Convite para Artemis Chat', emailHtml)

    return { success: true, message: 'Convite enviado com sucesso', data: newUser }

  } catch (error) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
