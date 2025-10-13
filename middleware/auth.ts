export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  const session = useSupabaseSession()

  // Se não há usuário nem sessão, redireciona para login
  if (!user.value && !session.value) {
    return navigateTo('/')
  }

  // Se há sessão mas usuário ainda não foi populado (estado intermediário),
  // aguarda um pouco para evitar redirecionamento prematuro
  if (session.value && !user.value) {
    // Aguarda até 1 segundo pelo usuário ser populado
    let attempts = 0
    const maxAttempts = 10

    while (!user.value && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    // Se mesmo assim não houver usuário, redireciona
    if (!user.value) {
      return navigateTo('/')
    }
  }
}) 