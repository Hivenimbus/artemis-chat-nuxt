export const useEmpresas = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const empresas = ref<any[]>([])

  const getEmpresas = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/empresas')
      empresas.value = response.data
      return response
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Erro ao buscar empresas'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Formatar data para exibição
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Obter cor do status de vencimento
  const getCorStatusVencimento = (status: string) => {
    switch (status) {
      case 'vencido':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          badge: 'bg-red-500'
        }
      case 'urgente':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-200',
          badge: 'bg-orange-500'
        }
      case 'atencao':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          badge: 'bg-yellow-500'
        }
      default:
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          badge: 'bg-green-500'
        }
    }
  }

  // Obter texto do status de vencimento
  const getTextoStatusVencimento = (status: string, dias: number) => {
    switch (status) {
      case 'vencido':
        return `Vencido há ${Math.abs(dias)} dias`
      case 'urgente':
        return `Vence em ${dias} dias`
      case 'atencao':
        return `Vence em ${dias} dias`
      default:
        return `Vence em ${dias} dias`
    }
  }

  // Auto-carregar dados quando o composable for usado no cliente
  onMounted(async () => {
    if (empresas.value.length === 0) {
      try {
        await getEmpresas()
      } catch (err) {
        console.error('Erro ao carregar empresas:', err)
      }
    }
  })

  return {
    loading: readonly(loading),
    error: readonly(error),
    empresas: readonly(empresas),
    getEmpresas,
    formatarData,
    getCorStatusVencimento,
    getTextoStatusVencimento
  }
}