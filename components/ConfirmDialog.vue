<template>
  <Transition name="fade">
    <div
      v-if="isVisible"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="handleCancel"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="options.title"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div :class="[
            'p-2 rounded-full',
            options.type === 'danger' ? 'bg-red-100 text-red-600' :
            options.type === 'warning' ? 'bg-amber-100 text-amber-600' :
            'bg-blue-100 text-blue-600'
          ]">
            <svg v-if="options.type === 'danger'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else-if="options.type === 'warning'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ options.title }}
          </h3>
        </div>

        <!-- Body -->
        <div class="px-6 py-4">
          <p class="text-gray-600">
            {{ options.message }}
          </p>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            @click="handleCancel"
          >
            {{ options.cancelText }}
          </button>
          <button
            type="button"
            :class="[
              'px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
              options.type === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
              options.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' :
              'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            ]"
            @click="handleConfirm"
          >
            {{ options.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useConfirm } from '~/composables/useConfirm'

const { isVisible, options, handleConfirm, handleCancel } = useConfirm()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

