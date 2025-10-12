export default defineNuxtRouteMiddleware(async (to) => {
  // Se estiver acessando uma rota superadmin, verificar permissões
  if (to.path.startsWith('/superadmin')) {
    const { isSuperAdmin, loading } = useSuperAdmin()

    // Aguardar verificação completar
    if (loading.value) {
      return
    }

    // Se não for superadmin, redirecionar para atendimentos
    if (!isSuperAdmin.value) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Você não tem permissão para acessar esta área.'
      })
    }
  }
})