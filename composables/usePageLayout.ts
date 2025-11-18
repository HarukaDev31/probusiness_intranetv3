import { ref } from 'vue'

// Global reactive flag to indicate the page content should be centered when tables are narrow
export const isContentNarrow = ref(false)
export const setContentNarrow = (v: boolean) => { isContentNarrow.value = !!v }
