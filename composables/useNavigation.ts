import { useRouter } from 'vue-router'

export function useNavigation() {
  const router = useRouter()

  const goBack = (targetPath?: string) => {
    if (targetPath) {
      router.push(targetPath)
    } else {
      router.back()
    }
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  return {
    goBack,
    navigateTo
  }
} 