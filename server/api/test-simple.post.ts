export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    console.log('🧪 Teste simples recebido:', body)

    return {
      success: true,
      message: 'Teste simples funcionando',
      received: body
    }

  } catch (error) {
    console.error('❌ Erro no teste simples:', error)
    return {
      success: false,
      error: error.message
    }
  }
})