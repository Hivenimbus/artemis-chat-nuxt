export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { text, option } = body

  if (!text || !option) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Texto e opção são obrigatórios'
    })
  }

  if (!config.openrouterApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Chave da API do OpenRouter não configurada'
    })
  }

  let prompt = ''
  switch (option) {
    case 'corrigir':
      prompt = 'Corrija erros de ortografia e gramática do seguinte texto, mantendo o tom original. Retorne apenas o texto corrigido:'
      break
    case 'melhorar':
      prompt = 'Melhore a clareza e fluidez do seguinte texto, tornando-o mais natural. Retorne apenas o texto melhorado:'
      break
    case 'formal':
      prompt = 'Reescreva o seguinte texto de forma mais formal e profissional. Retorne apenas o texto reescrito:'
      break
    case 'resumir':
      prompt = 'Resuma o seguinte texto mantendo os pontos principais. Retorne apenas o resumo:'
      break
    case 'expandir':
      prompt = 'Expanda o seguinte texto adicionando detalhes relevantes e mantendo o contexto. Retorne apenas o texto expandido:'
      break
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Opção inválida'
      })
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.public.siteUrl, // Opcional, mas recomendado pelo OpenRouter
        'X-Title': 'MULTICONEX' // Opcional
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview', // Modelo atualizado para Gemini Flash
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente útil que ajuda a melhorar textos de mensagens. Responda apenas com o texto solicitado, sem explicações adicionais.'
          },
          {
            role: 'user',
            content: `${prompt}\n\n"${text}"`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Erro na API do OpenRouter')
    }

    const data = await response.json()
    const result = data.choices[0]?.message?.content?.trim() || ''

    // Remover aspas se o modelo as incluir na resposta
    const cleanResult = result.replace(/^"|"$/g, '')

    return {
      success: true,
      data: cleanResult
    }
  } catch (error) {
    console.error('Erro na geração de IA:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao processar solicitação de IA'
    })
  }
})

