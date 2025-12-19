<template>
  <div :class="['lazy-image-wrapper', wrapperClass]" :style="wrapperStyle">
    <div v-if="!loaded && !failed" class="lazy-skeleton" />
    <div v-if="failed" class="lazy-fallback">?</div>
    <img v-if="src" :src="src" :alt="alt" :width="width" :height="height" :class="imgClass"
      loading="lazy" decoding="async" @load="onLoad" @error="onError" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
const {
  src,
  alt,
  width,
  height,
  class: imgClassProp,
  wrapperClass: wrapperClassProp
} = defineProps<{
  src?: string | null
  alt?: string
  width?: number | string
  height?: number | string
  class?: string
  wrapperClass?: string
}>()

const loaded = ref(false)
const failed = ref(false)

const onLoad = () => {
  loaded.value = true
}
const onError = (e: Event) => {
  failed.value = true
  console.warn('ImageLazy failed to load', src, e)
}

const imgClass = computed(() => imgClassProp || '')
const wrapperClass = computed(() => wrapperClassProp || '')
const wrapperStyle = computed(() => {
  const w: any = {}
  if (width) w.width = typeof width === 'number' ? `${width}px` : width
  if (height) w.height = typeof height === 'number' ? `${height}px` : height
  return w
})
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
}
.lazy-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}
.lazy-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  background: #f8fafc;
}
img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@keyframes shimmer {
  0% { background-position: -200% 0 }
  100% { background-position: 200% 0 }
}
</style>

