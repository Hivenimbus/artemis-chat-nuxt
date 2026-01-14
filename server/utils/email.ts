import nodemailer from 'nodemailer'

export const sendEmail = async (to: string, subject: string, html: string) => {
  const config = useRuntimeConfig()

  // Debug da configuração (ocultando a senha)
  console.log('📧 Tentando enviar email com config:', {
    host: config.smtpHost,
    port: config.smtpPort,
    user: config.smtpUser,
    secure: Number(config.smtpPort) === 465,
    hasPass: !!config.smtpPass
  })

  // Se não tiver configuração de SMTP, apenas logar no console (dev mode)
  if (!config.smtpHost || !config.smtpUser) {
    console.log('⚠️ SMTP não configurado. Email não enviado (Simulação).')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('--- Conteúdo do Email ---')
    console.log(html)
    console.log('-------------------------')
    return
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost as string,
    port: Number(config.smtpPort) || 587,
    secure: Number(config.smtpPort) === 465,
    // Forçar nome do cliente para evitar "localhost" que é rejeitado por muitos servidores
    name: 'hivebot.cloud', 
    auth: {
      user: config.smtpUser as string,
      pass: config.smtpPass as string,
    },
    // Habilitar logs detalhados do Nodemailer
    logger: true,
    debug: true
  })

  try {
    const info = await transporter.sendMail({
      // Garante que o remetente é válido
      from: config.smtpFrom || `MULTICONEX <${config.smtpUser}>`, 
      to,
      subject,
      html,
      // Forçar Message-ID com domínio válido
      messageId: `<${Date.now()}.${Math.random().toString(36).substring(2)}@hivebot.cloud>`,
      // Cabeçalhos adicionais para melhorar reputação
      headers: {
        'X-Entity-Ref-ID': Math.random().toString(36).substring(2),
        'List-Unsubscribe': `<mailto:${config.smtpUser}>`
      }
    })
    
    console.log('✅ Email enviado com sucesso!')
    console.log('Message ID:', info.messageId)
    console.log('Response:', info.response)
    
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    throw new Error('Falha ao enviar email')
  }
}

