import { useEffect } from 'react'
import { router } from 'expo-router'
import { supabase } from '@/utils/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function App() {
  useEffect(() => {
    checkInitialRoute()
  }, [])

  const checkInitialRoute = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding')
      
      if (session && hasCompletedOnboarding === 'true') {
        router.replace('/(tabs)')
      } else {
        router.replace('/onboarding')
      }
    } catch (error) {
      console.error('Error checking initial route:', error)
      router.replace('/onboarding')
    }
  }

  return null
}
