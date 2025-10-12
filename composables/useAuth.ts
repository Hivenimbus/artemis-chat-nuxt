export const useAuth = () => {
  const user = useSupabaseUser()

  // Extrair informações do usuário do Supabase
  const userName = computed(() => {
    if (!user.value) return 'Administrador'

    // Tentar obter nome do user_metadata ou usar email como fallback
    const metadata = user.value.user_metadata || {}
    return metadata.name || metadata.full_name || user.value.email?.split('@')[0] || 'Administrador'
  })

  const userEmail = computed(() => {
    return user.value?.email || 'admin@artemis.com'
  })

  const userInitials = computed(() => {
    return userName.value.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  const isAuthenticated = computed(() => !!user.value)
  const isLoading = computed(() => user.value === undefined)

  return {
    user: readonly(user),
    userName: readonly(userName),
    userEmail: readonly(userEmail),
    userInitials: readonly(userInitials),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading)
  }
}