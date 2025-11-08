<template>
  <!-- Sistema de Notificações Toast -->
  <div class="notifications-container">
    <TransitionGroup name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification',
          `notification--${notification.type}`
        ]"
      >
        <div class="notification__content">
          <div class="notification__icon">
            <!-- Ícone Success -->
            <svg v-if="notification.type === 'success'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <!-- Ícone Error -->
            <svg v-else-if="notification.type === 'error'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <!-- Ícone Warning -->
            <svg v-else-if="notification.type === 'warning'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <!-- Ícone Info -->
            <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="notification__message">
            {{ notification.message }}
          </div>
          <button
            @click="removeToast(notification.id)"
            class="notification__close"
            aria-label="Fechar notificação"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
const { notifications, removeToast } = useToast()
</script>

<style scoped>
/* Container de Notificações */
.notifications-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
  max-width: 400px;
}

/* Card de Notificação */
.notification {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  margin-bottom: 0.75rem;
  pointer-events: all;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 250ms cubic-bezier(.22, 1, .36, 1);
  transform-origin: top right;
}

/* Tipos de Notificação (Border-left colorido) */
.notification--success {
  border-left: 4px solid #10b981;
}

.notification--error {
  border-left: 4px solid #ef4444;
}

.notification--warning {
  border-left: 4px solid #f59e0b;
}

.notification--info {
  border-left: 4px solid #3b82f6;
}

/* Conteúdo da Notificação */
.notification__content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
}

/* Ícone */
.notification__icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.notification--success .notification__icon {
  color: #10b981;
}

.notification--error .notification__icon {
  color: #ef4444;
}

.notification--warning .notification__icon {
  color: #f59e0b;
}

.notification--info .notification__icon {
  color: #3b82f6;
}

/* Mensagem */
.notification__message {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
}

/* Botão Fechar */
.notification__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  color: #9ca3af;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;
  margin: -0.25rem;
  padding: 0;
}

.notification__close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
}

.notification__close svg {
  width: 1rem;
  height: 1rem;
}

/* Animações de Transição */
.notification-enter-active {
  transition: all 250ms cubic-bezier(.22, 1, .36, 1);
}

.notification-leave-active {
  transition: all 200ms cubic-bezier(.5, 0, .75, 0);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.notification-move {
  transition: transform 250ms cubic-bezier(.22, 1, .36, 1);
}

/* Responsivo */
@media (max-width: 640px) {
  .notifications-container {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }
}
</style>
