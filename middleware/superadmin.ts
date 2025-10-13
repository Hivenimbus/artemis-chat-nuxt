export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isSuperAdmin, loading, getUserData, userData } = useUser()

  // Se os dados já foram carregados, verificar imediatamente
  if (!loading.value && userData.value) {
    if (!isSuperAdmin.value) {
      return navigateTo('/atendimentos')
    }
    return
  }

  // Se ainda está carregando, tentar carregar os dados
  try {
    await getUserData()

    // Após carregar, verificar a permissão
    if (!isSuperAdmin.value) {
      return navigateTo('/atendimentos')
    }
  } catch (error) {
    console.error('Erro ao verificar permissões de superadmin:', error)
    // Em caso de erro, redirecionar para atendimentos por segurança
    return navigateTo('/atendimentos')
  }
})