<template>
  <div class="empresa-list-item" :class="statusClasses">
    <!-- Main Row -->
    <div class="empresa-list-item__main">
      <!-- Company Info -->
      <div class="empresa-list-item__company">
        <div class="empresa-list-item__company-info">
          <h3 class="empresa-list-item__title">{{ empresa.nome }}</h3>
          <div class="empresa-list-item__meta">
            <span class="empresa-list-item__meta-item">
              Criada em {{ formatarData(empresa.criadaEm) }}
            </span>
          </div>
        </div>

        <!-- Status Badge & Actions -->
        <div class="empresa-list-item__actions">
          <!-- Status Badge -->
          <div class="empresa-list-item__badge" :class="statusBadgeClasses">
            <svg class="empresa-list-item__badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ textoStatus }}
          </div>

          <!-- Edit Button -->
          <button
            @click="$emit('edit', empresa)"
            class="empresa-list-item__edit-btn"
            title="Editar empresa"
          >
            <svg class="empresa-list-item__edit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Info Row -->
      <div class="empresa-list-item__info">
        <!-- Vencimento -->
        <div class="empresa-list-item__vencimento">
          <svg class="empresa-list-item__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="empresa-list-item__info-label">Vencimento:</span>
          <span class="empresa-list-item__info-value">{{ formatarData(empresa.vencimento) }}</span>
        </div>

        <!-- Users Count -->
        <div class="empresa-list-item__users">
          <svg class="empresa-list-item__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="empresa-list-item__info-label">Usuários:</span>
          <span class="empresa-list-item__info-value">{{ empresa.totalUsuarios }}</span>
        </div>
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

// Composables
const { formatarData, getCorStatusVencimento, getTextoStatusVencimento } = useEmpresas()

// Computed properties
const statusClasses = computed(() => {
  const cores = getCorStatusVencimento(props.empresa.statusVencimento)
  return `empresa-list-item--${props.empresa.statusVencimento} ${cores.border}`
})

const statusBadgeClasses = computed(() => {
  const cores = getCorStatusVencimento(props.empresa.statusVencimento)
  return cores.badge
})

const textoStatus = computed(() => {
  return getTextoStatusVencimento(props.empresa.statusVencimento, props.empresa.diasParaVencimento)
})
</script>

<style scoped>
/* Local CSS Variables */
.empresa-list-item {
  --bg-0: 244 246 250;
  --bg-1: 255 255 255;
  --txt-1: 17 24 39;
  --txt-2: 75 85 99;
  --txt-3: 156 163 175;
  --ring: 59 130 246;

  --radius-xs: 8px;
  --radius-sm: 12px;

  --shadow-1: 0 2px 8px rgba(0,0,0,.06);
  --shadow-2: 0 4px 16px rgba(0,0,0,.1);

  --dur-fast: 200ms;
  --dur-slow: 300ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1);

  position: relative;
  background: rgb(var(--bg-1));
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-1);
  transition: all var(--dur-fast) var(--ease-out);
  overflow: hidden;
}

.empresa-list-item:hover {
  box-shadow: var(--shadow-2);
}

/* Status variants */
.empresa-list-item--vencido {
  border-color: rgb(239 68 68);
  background: linear-gradient(135deg, rgb(255 255 255) 0%, rgb(254 226 226) 100%);
}

.empresa-list-item--urgente {
  border-color: rgb(249 115 22);
  background: linear-gradient(135deg, rgb(255 255 255) 0%, rgb(254 237 213) 100%);
}

.empresa-list-item--atencao {
  border-color: rgb(245 158 11);
  background: linear-gradient(135deg, rgb(255 255 255) 0%, rgb(254 243 199) 100%);
}

.empresa-list-item--normal {
  border-color: rgb(34 197 94);
  background: linear-gradient(135deg, rgb(255 255 255) 0%, rgb(220 252 231) 100%);
}

/* Main Row */
.empresa-list-item__main {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  gap: 1rem;
}

/* Company Info */
.empresa-list-item__company {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
}

.empresa-list-item__company-info {
  flex: 1;
  min-width: 0;
}

.empresa-list-item__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: rgb(var(--txt-1));
  line-height: 1.4;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empresa-list-item__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empresa-list-item__meta-item {
  font-size: 0.75rem;
  color: rgb(var(--txt-3));
}

/* Status Badge & Actions */
.empresa-list-item__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.empresa-list-item__badge {
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

.empresa-list-item__edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: rgb(var(--ring));
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  flex-shrink: 0;
}

.empresa-list-item__edit-btn:hover {
  background: rgb(37 99 235);
  transform: scale(1.05);
}

.empresa-list-item__edit-btn:active {
  transform: scale(0.95);
}

.empresa-list-item__edit-icon {
  width: 1rem;
  height: 1rem;
}

.empresa-list-item__badge-icon {
  width: 1rem;
  height: 1rem;
}

/* Info Row */
.empresa-list-item__info {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-shrink: 0;
}

.empresa-list-item__vencimento,
.empresa-list-item__users {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empresa-list-item__info-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: rgb(var(--txt-2));
  flex-shrink: 0;
}

.empresa-list-item__info-label {
  font-size: 0.875rem;
  color: rgb(var(--txt-2));
  font-weight: 500;
  white-space: nowrap;
}

.empresa-list-item__info-value {
  font-size: 0.875rem;
  color: rgb(var(--txt-1));
  font-weight: 700;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 1024px) {
  .empresa-list-item__main {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .empresa-list-item__company {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .empresa-list-item__info {
    justify-content: space-between;
    gap: 1rem;
  }
}

@media (max-width: 640px) {
  .empresa-list-item__main {
    padding: 1rem;
  }

  .empresa-list-item__title {
    font-size: 1rem;
  }

  .empresa-list-item__info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
