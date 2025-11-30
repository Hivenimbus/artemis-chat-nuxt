<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Elementos de fundo decorativos -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      <div class="absolute top-40 left-1/2 w-80 h-80 bg-pink-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
    </div>

    <div class="max-w-md w-full relative z-10">
      <!-- Card principal -->
      <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-8 border border-white/20 transform hover:scale-[1.02] transition-all duration-300">
        
        <!-- Logo/Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform duration-300">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 class="mt-6 text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Bem-vindo de volta
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Entre na sua conta ou
            <button 
              type="button"
              @click="toggleMode"
              class="font-semibold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              {{ isSignUp ? 'faça login' : 'crie uma conta' }}
            </button>
          </p>
        </div>

        <!-- Mensagem de erro -->
        <Transition name="slide-down">
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>
              <button @click="errorMessage = ''" class="ml-auto">
                <svg class="h-4 w-4 text-red-600 hover:text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </Transition>

        <!-- Mensagem de sucesso -->
        <Transition name="slide-down">
          <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-800">{{ successMessage }}</p>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Formulário -->
        <form class="space-y-6" @submit.prevent="isSignUp ? handleSignUp() : handleLogin()">
          <div class="space-y-4">
            <!-- Campo Nome (apenas para cadastro) -->
            <Transition name="slide-down">
              <div v-if="isSignUp" class="relative">
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    v-model="form.name"
                    class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            </Transition>

            <!-- Campo Email -->
            <div class="relative">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  v-model="form.email"
                  class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <!-- Campo Senha -->
            <div class="relative">
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  v-model="form.password"
                  class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white password-field"
                  :placeholder="isSignUp ? 'Mínimo 6 caracteres' : 'Sua senha'"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg v-if="!showPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg v-else class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                  </svg>
                </button>
              </div>
              <!-- Indicador de força da senha -->
              <div v-if="isSignUp && form.password" class="mt-2">
                <div class="flex space-x-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="h-1 flex-1 rounded-full transition-all duration-300"
                    :class="getPasswordStrengthColor(i)"
                  ></div>
                </div>
                <p class="text-xs mt-1" :class="getPasswordStrengthTextColor()">
                  {{ getPasswordStrengthText() }}
                </p>
              </div>
            </div>
          </div>

          <!-- Lembrar de mim / Esqueceu senha -->
          <div v-if="!isSignUp" class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                v-model="form.rememberMe"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors duration-200"
              />
              <label for="remember-me" class="ml-3 block text-sm text-gray-700">
                Lembrar de mim
              </label>
            </div>

            <div class="text-sm">
              <a href="#" class="font-medium text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text hover:from-indigo-700 hover:to-purple-700">
                Esqueceu a senha?
              </a>
            </div>
          </div>

          <!-- Botão de submit -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg
                  v-if="!isLoading"
                  class="h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors duration-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path v-if="!isSignUp" fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  <path v-else fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5 text-indigo-300 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/>
                  <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </span>
              {{ getButtonText() }}
            </button>
          </div>
        </form>

        <!-- Footer -->
        <div class="text-center text-xs text-gray-500">
          <p>Ao continuar, você concorda com nossos</p>
          <div class="flex justify-center space-x-4 mt-1">
            <a href="#" class="hover:text-indigo-600 transition-colors duration-200">Termos de Uso</a>
            <span>•</span>
            <a href="#" class="hover:text-indigo-600 transition-colors duration-200">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Auth
const { login, register, user, loading: authLoading, error: authError } = useAuth()

// Estados reativos
const form = ref({
  name: '',
  email: '',
  password: '',
  rememberMe: false
})

// Usar loading e error do useAuth mas manter controle local para UI se necessário
const isLoading = computed(() => authLoading.value)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const isSignUp = ref(false)

// Monitorar erro do auth
watch(authError, (newError) => {
  if (newError) {
    errorMessage.value = newError
  }
})

// Redirecionar se já estiver logado
watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/atendimentos')
  }
}, { immediate: true })

// Computed para texto do botão
const getButtonText = () => {
  if (isLoading.value) {
    return isSignUp.value ? 'Criando conta...' : 'Entrando...'
  }
  return isSignUp.value ? 'Criar conta' : 'Entrar'
}

// Função para alternar entre login/cadastro
const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  errorMessage.value = ''
  successMessage.value = ''
  form.value.name = ''
}

// Função para calcular força da senha
const getPasswordStrength = () => {
  const password = form.value.password
  let strength = 0
  
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
  
  return strength
}

const getPasswordStrengthColor = (index) => {
  const strength = getPasswordStrength()
  if (index <= strength) {
    switch (strength) {
      case 1: return 'bg-red-400'
      case 2: return 'bg-yellow-400'
      case 3: return 'bg-blue-400'
      case 4: return 'bg-green-400'
      default: return 'bg-gray-200'
    }
  }
  return 'bg-gray-200'
}

const getPasswordStrengthText = () => {
  const strength = getPasswordStrength()
  switch (strength) {
    case 1: return 'Senha fraca'
    case 2: return 'Senha regular'
    case 3: return 'Senha boa'
    case 4: return 'Senha forte'
    default: return 'Digite uma senha'
  }
}

const getPasswordStrengthTextColor = () => {
  const strength = getPasswordStrength()
  switch (strength) {
    case 1: return 'text-red-600'
    case 2: return 'text-yellow-600'
    case 3: return 'text-blue-600'
    case 4: return 'text-green-600'
    default: return 'text-gray-400'
  }
}

// Função para lidar com o login
const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    errorMessage.value = 'Por favor, preencha todos os campos'
    return
  }

  errorMessage.value = ''
  
  try {
    await login({
      email: form.value.email,
      password: form.value.password,
    })

    successMessage.value = 'Login realizado com sucesso!'
    // Redirecionamento é tratado no watch(user) ou pelo useAuth
    
  } catch (error) {
    console.error('Erro no login:', error)
    // Erro já definido no watch(authError) ou abaixo
    // errorMessage é atualizado pelo watcher
  }
}

// Função para cadastro
const handleSignUp = async () => {
  if (!form.value.name || !form.value.email || !form.value.password) {
    errorMessage.value = 'Por favor, preencha todos os campos'
    return
  }

  if (form.value.password.length < 6) {
    errorMessage.value = 'A senha deve ter pelo menos 6 caracteres'
    return
  }

  errorMessage.value = ''
  
  try {
    await register({
      email: form.value.email,
      password: form.value.password,
      name: form.value.name
    })

    successMessage.value = 'Conta criada com sucesso!'
    // Login automático após registro ou redirecionamento
    
  } catch (error) {
    console.error('Erro no cadastro:', error)
  }
}

// Definir layout da página
definePageMeta({
  layout: 'auth'
})

// Meta tags para SEO
useHead({
  title: isSignUp.value ? 'Criar Conta' : 'Login',
  meta: [
    { name: 'description', content: 'Faça login ou crie sua conta' }
  ]
})
</script>

<style scoped>
/* Remover ícone nativo de mostrar/esconder senha */
.password-field::-ms-reveal,
.password-field::-ms-clear {
  display: none;
}

.password-field::-webkit-credentials-auto-fill-button {
  display: none !important;
}

.password-field::-webkit-strong-password-auto-fill-button {
  display: none !important;
}

/* Para Firefox */
.password-field {
  -moz-appearance: textfield;
}

/* Para Chrome/Safari - ocultar o ícone de olho */
input[type="password"]::-webkit-textfield-decoration-container {
  visibility: hidden;
}

input[type="password"]::-webkit-reveal {
  display: none;
}

/* Animações customizadas */
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

/* Transições */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
