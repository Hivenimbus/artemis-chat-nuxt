<template>
  <div class="virtual-list" :style="{ height: containerHeight + 'px' }" @scroll="handleScroll">
    <div class="virtual-list__phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-list__content" :style="{ transform: `translateY(${offsetY}px)` }">
      <div
        v-for="item in visibleItems"
        :key="item.key"
        :style="{ height: itemSize + 'px' }"
        class="virtual-list__item"
      >
        <slot :item="item.data" :index="item.index"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemSize: {
    type: Number,
    default: 120
  },
  containerHeight: {
    type: Number,
    default: 400
  },
  bufferSize: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['scroll'])

// Estado
const scrollTop = ref(0)
const containerRef = ref(null)

// Computados
const totalHeight = computed(() => props.items.length * props.itemSize)

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemSize) - props.bufferSize)
})

const endIndex = computed(() => {
  return Math.min(
    props.items.length - 1,
    Math.ceil((scrollTop.value + props.containerHeight) / props.itemSize) + props.bufferSize
  )
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1).map((item, index) => ({
    data: item,
    index: startIndex.value + index,
    key: `virtual-item-${startIndex.value + index}`
  }))
})

const offsetY = computed(() => startIndex.value * props.itemSize)

// Métodos
const handleScroll = (event) => {
  scrollTop.value = event.target.scrollTop
  emit('scroll', event)
}

const scrollToIndex = (index) => {
  if (containerRef.value) {
    const targetScrollTop = index * props.itemSize
    containerRef.value.scrollTop = targetScrollTop
  }
}

const scrollToTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = totalHeight.value
  }
}

// Expor métodos
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom
})
</script>

<style scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-list__phantom {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: -1;
}

.virtual-list__content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-list__item {
  overflow: hidden;
}

/* Otimizações de scroll */
.virtual-list {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.virtual-list::-webkit-scrollbar {
  width: 8px;
}

.virtual-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.virtual-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.virtual-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>