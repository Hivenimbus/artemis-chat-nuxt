// Composable para gerenciamento de contatos

export const useContatos = () => {
  // Estado de loading
  const loading = ref(false)
  const error = ref(null)

  // Buscar lista de contatos com paginação e filtros
  const fetchContatos = async (options = {}) => {
    const {
      page = 1,
      limit = 10,
      search = ''
    } = options

    loading.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (search.trim()) {
        queryParams.append('search', search.trim())
      }

      const { data, error: apiError } = await $fetch(`/api/contatos?${queryParams.toString()}`)

      if (apiError) {
        throw apiError
      }

      return data
    } catch (err) {
      console.error('useContatos.fetchContatos: Erro ao buscar contatos:', err)
      error.value = err.message || 'Erro ao buscar contatos'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Buscar contato específico por ID
  const fetchContatoById = async (id) => {
    if (!id) {
      throw new Error('ID do contato não fornecido')
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: apiError } = await $fetch(`/api/contatos/${id}`)

      if (apiError) {
        throw apiError
      }

      return data
    } catch (err) {
      console.error('useContatos.fetchContatoById: Erro ao buscar contato:', err)
      error.value = err.message || 'Erro ao buscar contato'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Criar novo contato
  const createContato = async (contatoData) => {
    loading.value = true
    error.value = null

    try {
      // Validação básica dos campos obrigatórios
      const requiredFields = ['nome', 'telefone']
      const missingFields = requiredFields.filter(field => !contatoData[field])

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios: ${missingFields.join(', ')}`)
      }

      // Validar formato do email apenas se fornecido
      if (contatoData.email && contatoData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(contatoData.email.trim())) {
          throw new Error('Email inválido')
        }
      }

      // Validar telefone
      const cleanPhone = contatoData.telefone.replace(/\D/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        throw new Error('Telefone inválido')
      }

      const { data, error: apiError } = await $fetch('/api/contatos', {
        method: 'POST',
        body: {
          ...contatoData,
          tags: contatoData.tags || []
        }
      })

      if (apiError) {
        throw apiError
      }

      return data
    } catch (err) {
      console.error('useContatos.createContato: Erro ao criar contato:', err)
      error.value = err.message || 'Erro ao criar contato'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Atualizar contato existente
  const updateContato = async (id, contatoData) => {
    if (!id) {
      throw new Error('ID do contato não fornecido')
    }

    loading.value = true
    error.value = null

    try {
      // Validação básica dos campos obrigatórios
      const requiredFields = ['nome', 'telefone']
      const missingFields = requiredFields.filter(field => !contatoData[field])

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios: ${missingFields.join(', ')}`)
      }

      // Validar formato do email apenas se fornecido
      if (contatoData.email && contatoData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(contatoData.email.trim())) {
          throw new Error('Email inválido')
        }
      }

      // Validar telefone
      const cleanPhone = contatoData.telefone.replace(/\D/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        throw new Error('Telefone inválido')
      }

      const { data, error: apiError } = await $fetch(`/api/contatos/${id}`, {
        method: 'PUT',
        body: {
          ...contatoData,
          tags: contatoData.tags || []
        }
      })

      if (apiError) {
        throw apiError
      }

      return data
    } catch (err) {
      console.error('useContatos.updateContato: Erro ao atualizar contato:', err)
      error.value = err.message || 'Erro ao atualizar contato'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Excluir contato
  const deleteContato = async (id) => {
    if (!id) {
      throw new Error('ID do contato não fornecido')
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: apiError } = await $fetch(`/api/contatos/${id}`, {
        method: 'DELETE'
      })

      if (apiError) {
        throw apiError
      }

      return data
    } catch (err) {
      console.error('useContatos.deleteContato: Erro ao excluir contato:', err)
      error.value = err.message || 'Erro ao excluir contato'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Buscar etiquetas disponíveis para a empresa
  const fetchEtiquetas = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: apiError } = await $fetch('/api/etiquetas')

      if (apiError) {
        throw apiError
      }

      // Retornar apenas os nomes das etiquetas para compatibilidade com o frontend
      return data.map(etiqueta => etiqueta.nome)
    } catch (err) {
      console.error('useContatos.fetchEtiquetas: Erro ao buscar etiquetas:', err)
      error.value = err.message || 'Erro ao buscar etiquetas'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Limpar estado de erro
  const clearError = () => {
    error.value = null
  }

  return {
    // Estado
    loading: readonly(loading),
    error: readonly(error),

    // Métodos
    fetchContatos,
    fetchContatoById,
    createContato,
    updateContato,
    deleteContato,
    fetchEtiquetas,
    clearError
  }
}