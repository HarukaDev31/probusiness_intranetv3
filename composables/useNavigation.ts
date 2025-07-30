import { useRouter } from 'vue-router'

export function useNavigation() {
  const router = useRouter()

  const goBack = () => {
    router.back()
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  return {
    goBack,
    navigateTo
  }
} 