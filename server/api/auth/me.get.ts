export default defineEventHandler((event) => {
  // Evitar cache no endpoint de usuário para não retornar dados antigos
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  setResponseHeader(event, 'Pragma', 'no-cache')
  setResponseHeader(event, 'Expires', '0')
  setResponseHeader(event, 'Surrogate-Control', 'no-store')

  const user = event.context.user


  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autenticado'
    })
  }

  return { user }
})

