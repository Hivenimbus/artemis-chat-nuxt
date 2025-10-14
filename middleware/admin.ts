export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAdmin, loading, getUserData, userData } = useUser()

  // Se os dados já foram carregados, verificar imediatamente
  if (!loading.value && userData.value) {
    if (!isAdmin.value) {
      return navigateTo('/atendimentos')
    }
    return
  }

  // Se ainda está carregando, tentar carregar os dados
  try {
    await getUserData()

    // Após carregar, verificar a permissão
    if (!isAdmin.value) {
      return navigateTo('/atendimentos')
    }
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error)
    // Em caso de erro, redirecionar para atendimentos por segurança
    return navigateTo('/atendimentos')
  }
})