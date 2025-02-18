import 'react-native-get-random-values'
import { supabase } from './supabase'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { store } from '@/store'
import { clearUserData } from '@/store/userSlice'
import { RATING_KEY, SUCCESSFUL_ANALYSES_KEY } from '@/utils/rating';

export async function createAuthenticatedUser(userData: any, authUser: any) {
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        ...userData,
        created_at: new Date().toISOString(),
        notification_enabled: true,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

    if (error) throw error
    
    return { id: authUser.id }
  } catch (error) {
    console.error('Error creating authenticated user:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    store.dispatch(clearUserData())
    await Promise.all([
      AsyncStorage.removeItem(RATING_KEY),
      AsyncStorage.removeItem(SUCCESSFUL_ANALYSES_KEY),
      AsyncStorage.removeItem('hasCompletedOnboarding')
    ]);
    router.replace('/onboarding')
    return true
  } catch (error) {
    console.error('Error signing out:', error)
    return false
  }
}