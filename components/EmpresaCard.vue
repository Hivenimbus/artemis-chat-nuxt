<template>
  <div class="empresa-card" :class="statusClasses">
    <!-- Card Header -->
    <div class="empresa-card__header">
      <div class="empresa-card__title-section">
        <h3 class="empresa-card__title">{{ empresa.nome }}</h3>
        <div class="empresa-card__badge" :class="statusBadgeClasses">
          <svg class="empresa-card__badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ textoStatus }}
        </div>
      </div>
    </div>

    <!-- Card Content -->
    <div class="empresa-card__content">
      <!-- Vencimento Info -->
      <div class="empresa-card__vencimento">
        <div class="empresa-card__vencimento-item">
          <svg class="empresa-card__vencimento-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="empresa-card__vencimento-label">Vencimento:</span>
          <span class="empresa-card__vencimento-data">{{ formatarData(empresa.vencimento) }}</span>
        </div>
      </div>

      <!-- Users Info -->
      <div class="empresa-card__usuarios">
        <div class="empresa-card__usuarios-header">
          <svg class="empresa-card__usuarios-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="empresa-card__usuarios-count">{{ empresa.totalUsuarios }} usuário(s)</span>
        </div>

        <div class="empresa-card__usuarios-list">
          <div
            v-for="usuario in empresa.usuarios.slice(0, maxUsuariosVisiveis)"
            :key="usuario.id"
            class="empresa-card__usuario-item"
          >
            <div class="empresa-card__usuario-avatar">
              {{ usuario.nome.charAt(0).toUpperCase() }}
            </div>
            <div class="empresa-card__usuario-info">
              <div class="empresa-card__usuario-nome">{{ usuario.nome }}</div>
              <div class="empresa-card__usuario-email">{{ usuario.email }}</div>
            </div>
            <div class="empresa-card__usuario-role" :class="getRoleClasses(usuario.role)">
              {{ getRoleText(usuario.role) }}
            </div>
          </div>

          <!-- Mostrar botão "ver mais" se houver mais usuários -->
          <div
            v-if="empresa.usuarios.length > maxUsuariosVisiveis"
            class="empresa-card__ver-mais"
          >
            <button
              @click="toggleUsuariosVisiveis"
              class="empresa-card__ver-mais-btn"
            >
              {{ mostrarTodosUsuarios ? 'Ver menos' : `Ver mais ${empresa.usuarios.length - maxUsuariosVisiveis} usuário(s)` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="empresa-card__footer">
      <div class="empresa-card__meta">
        <span class="empresa-card__meta-item">
          Criada em {{ formatarData(empresa.criadaEm) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  empresa: {
    type: Object,
    required: true
  }
})

// State
const mostrarTodosUsuarios = ref(false)
const maxUsuariosVisiveis = computed(() => mostrarTodosUsuarios.value ? props.empresa.usuarios.length : 3)

// Composables
const { formatarData, getCorStatusVencimento, getTextoStatusVencimento } = useEmpresas()

// Computed properties
const statusClasses = computed(() => {
  const cores = getCorStatusVencimento(props.empresa.statusVencimento)
  return `empresa-card--${props.empresa.statusVencimento} ${cores.border}`
})

const statusBadgeClasses = computed(() => {
  const cores = getCorStatusVencimento(props.empresa.statusVencimento)
  return cores.badge
})

const textoStatus = computed(() => {
  return getTextoStatusVencimento(props.empresa.statusVencimento, props.empresa.diasParaVencimento)
})

// Methods
const toggleUsuariosVisiveis = () => {
  mostrarTodosUsuarios.value = !mostrarTodosUsuarios.value
}

const getRoleClasses = (role) => {
  switch (role) {
    case 'superadmin':
      return 'empresa-card__usuario-role--superadmin'
    case 'admin':
      return 'empresa-card__usuario-role--admin'
    default:
      return 'empresa-card__usuario-role--user'
  }
}

const getRoleText = (role) => {
  switch (role) {
    case 'superadmin':
      return 'Superadmin'
    case 'admin':
      return 'Admin'
    default:
      return 'Usuário'
  }
}
</script>

<style scoped>
/* Local CSS Variables */
.empresa-card {
  --bg-0: 244 246 250;
  --bg-1: 255 255 255;
  --txt-1: 17 24 39;
  --txt-2: 75 85 99;
  --txt-3: 156 163 175;
  --ring: 59 130 246;

  --radius-xs: 8px;
  --radius-sm: 12px;

  --shadow-1: 0 6px 18px rgba(0,0,0,.08);
  --shadow-2: 0 12px 28px rgba(0,0,0,.12);

  --dur-fast: 150ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1);

  position: relative;
  background: rgb(var(--bg-1));
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  padding: 1.5rem;
  box-shadow: var(--shadow-1);
  transition: all var(--dur-fast) var(--ease-out);
}

.empresa-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-2);
}

/* Status variants */
.empresa-card--vencido {
  border-color: rgb(239 68 68);
  background: linear-gradient(135deg, rgb(255 255 255) 0%, rgb(254 226 226) 100%);
}

.empresa-card--urgente {
  border-color: rgb(249 115 22);
  background: linear-gradient(135deg, rgb(255 255 255) 0%, rgb(254 237 213) 100%);
}

.empresa-card--atencao {
  border-color: rgb(245 158 11);
  background: linear-gradient(135deg, rgb(255 255 255) 0%, rgb(254 243 199) 100%);
}

.empresa-card--normal {
  border-color: rgb(34 197 94);
  background: linear-gradient(135deg, rgb(255 255 255) 0%, rgb(220 252 231) 100%);
}

/* Card Header */
.empresa-card__header {
  margin-bottom: 1.5rem;
}

.empresa-card__title-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.empresa-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--txt-1));
  line-height: 1.4;
  flex: 1;
  margin: 0;
}

.empresa-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.empresa-card__badge-icon {
  width: 1rem;
  height: 1rem;
}

/* Card Content */
.empresa-card__content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Vencimento */
.empresa-card__vencimento {
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-xs);
  padding: 1rem;
  border: 1px solid rgba(var(--txt-3), 0.1);
}

.empresa-card__vencimento-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.empresa-card__vencimento-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(var(--txt-2));
}

.empresa-card__vencimento-label {
  font-size: 0.875rem;
  color: rgb(var(--txt-2));
  font-weight: 500;
}

.empresa-card__vencimento-data {
  font-size: 0.875rem;
  color: rgb(var(--txt-1));
  font-weight: 700;
  margin-left: auto;
}

/* Usuários */
.empresa-card__usuarios {
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-xs);
  padding: 1rem;
  border: 1px solid rgba(var(--txt-3), 0.1);
}

.empresa-card__usuarios-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(var(--txt-3), 0.1);
}

.empresa-card__usuarios-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(var(--txt-2));
}

.empresa-card__usuarios-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--txt-1));
}

.empresa-card__usuarios-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empresa-card__usuario-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(var(--bg-0), 0.5);
  border-radius: var(--radius-xs);
  transition: all var(--dur-fast) var(--ease-out);
}

.empresa-card__usuario-item:hover {
  background: rgba(var(--bg-0), 1);
  transform: translateX(2px);
}

.empresa-card__usuario-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(var(--ring)), rgb(99 102 241));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.empresa-card__usuario-info {
  flex: 1;
  min-width: 0;
}

.empresa-card__usuario-nome {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--txt-1));
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empresa-card__usuario-email {
  font-size: 0.75rem;
  color: rgb(var(--txt-2));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empresa-card__usuario-role {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.empresa-card__usuario-role--superadmin {
  background: rgb(239 68 68);
  color: white;
}

.empresa-card__usuario-role--admin {
  background: rgb(59 130 246);
  color: white;
}

.empresa-card__usuario-role--user {
  background: rgb(156 163 175);
  color: white;
}

.empresa-card__ver-mais {
  margin-top: 0.5rem;
}

.empresa-card__ver-mais-btn {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  color: rgb(var(--ring));
  background: transparent;
  border: 1px solid rgb(var(--ring));
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  font-weight: 500;
}

.empresa-card__ver-mais-btn:hover {
  background: rgb(var(--ring));
  color: white;
}

/* Card Footer */
.empresa-card__footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(var(--txt-3), 0.1);
}

.empresa-card__meta {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empresa-card__meta-item {
  font-size: 0.75rem;
  color: rgb(var(--txt-3));
}

/* Responsive */
@media (max-width: 640px) {
  .empresa-card {
    padding: 1rem;
  }

  .empresa-card__title {
    font-size: 1.125rem;
  }

  .empresa-card__badge {
    font-size: 0.6875rem;
    padding: 0.375rem 0.5rem;
  }

  .empresa-card__usuario-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .empresa-card__usuario-avatar {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>