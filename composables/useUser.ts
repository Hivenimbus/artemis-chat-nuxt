export const useUser = () => {
  const { user: authUser } = useAuth()

  const { data: userData, refresh, status } = useAsyncData('useUser:data', async () => {
    const headers = useRequestHeaders(['cookie'])
    const response = await $fetch<any>('/api/user', { headers })
    return response.data
  }, {
    // Valor inicial vem do JWT (já SSR-hidratado via useAuth), evitando flash
    default: () => authUser.value || null,
    lazy: false
  })

  const getUserData = () => refresh()

  // Computed properties para fácil acesso
  const userRole = computed(() => userData.value?.role || 'user')
  const isSuperAdmin = computed(() => userRole.value === 'superadmin')
  const isAdmin = computed(() => userRole.value === 'admin' || isSuperAdmin.value)
  const userName = computed(() => userData.value?.name || '')
  const userEmail = computed(() => userData.value?.email || '')
  const loading = computed(() => status.value === 'pending')

  return {
    loading: readonly(loading),
    userData,
    userRole,
    isSuperAdmin,
    isAdmin,
    userName,
    userEmail,
    getUserData
  }
}
