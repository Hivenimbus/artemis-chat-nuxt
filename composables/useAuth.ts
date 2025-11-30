export const useAuth = () => {
  const user = useState('auth:user', () => {
    // Hidratar o estado do usuário no servidor se disponível no contexto
    if (import.meta.server) {
      const event = useRequestEvent()
      return event?.context.user || null
    }
    return null
  })
  
  const loading = useState('auth:loading', () => false)
  const error = useState('auth:error', () => null)

  const fetchUser = async () => {
    try {
      // No servidor, precisamos passar os headers (cookies) explicitamente
      const headers = useRequestHeaders(['cookie'])
      const data = await $fetch('/api/auth/me', { headers })
      user.value = data.user
    } catch (e) {
      user.value = null
    }
  }

  const login = async ({ email, password }) => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      user.value = data.user
      return data
    } catch (e) {
      error.value = e.data?.statusMessage || 'Erro ao fazer login'
      throw e
    } finally {
      loading.value = false
    }
  }

  const register = async ({ email, password, name }) => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password, name }
      })
      user.value = data.user
      return data
    } catch (e) {
      error.value = e.data?.statusMessage || 'Erro ao cadastrar'
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      navigateTo('/')
    } catch (e) {
      console.error('Erro ao fazer logout', e)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    fetchUser
  }
}
