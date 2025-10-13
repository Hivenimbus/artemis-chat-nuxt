export const useUser = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userData = ref<any>(null)

  const getUserData = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/user')
      userData.value = response.data
      return response
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Erro ao buscar dados do usuário'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties para fácil acesso
  const userRole = computed(() => userData.value?.role || 'user')
  const isSuperAdmin = computed(() => userRole.value === 'superadmin')
  const isAdmin = computed(() => userRole.value === 'admin' || isSuperAdmin.value)
  const userName = computed(() => userData.value?.name || 'Usuário')
  const userEmail = computed(() => userData.value?.email || '')

  // Auto-carregar dados quando o composable for usado no cliente
  onMounted(async () => {
    if (!userData.value) {
      try {
        await getUserData()
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err)
      }
    }
  })

  return {
    loading: readonly(loading),
    error: readonly(error),
    userData: readonly(userData),
    userRole: readonly(userRole),
    isSuperAdmin: readonly(isSuperAdmin),
    isAdmin: readonly(isAdmin),
    userName: readonly(userName),
    userEmail: readonly(userEmail),
    getUserData
  }
}