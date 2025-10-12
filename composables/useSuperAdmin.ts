import { useSupabaseClient } from '#imports'

export const useSuperAdmin = () => {
  const supabase = useSupabaseClient()
  const user = ref(null)
  const loading = ref(true)
  const isSuperAdmin = ref(false)

  // Verificar se o usuário logado é superadmin
  const checkSuperAdmin = async () => {
    try {
      loading.value = true

      // Obter usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        isSuperAdmin.value = false
        return false
      }

      // Buscar role do usuário na tabela users
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (error) {
        console.error('Erro ao buscar role do usuário:', error)
        isSuperAdmin.value = false
        return false
      }

      user.value = {
        ...currentUser,
        role: userData?.role || 'user'
      }

      isSuperAdmin.value = userData?.role === 'superadmin'
      return isSuperAdmin.value

    } catch (error) {
      console.error('Erro ao verificar superadmin:', error)
      isSuperAdmin.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  // Observar mudanças na autenticação
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      await checkSuperAdmin()
    } else if (event === 'SIGNED_OUT') {
      user.value = null
      isSuperAdmin.value = false
    }
  })

  // Inicializar verificação
  onMounted(() => {
    checkSuperAdmin()
  })

  return {
    user: readonly(user),
    isSuperAdmin: readonly(isSuperAdmin),
    loading: readonly(loading),
    checkSuperAdmin
  }
}