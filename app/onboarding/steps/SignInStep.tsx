import React, { useEffect } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Text } from 'react-native-paper'
import { Auth } from '@/components/Auth.native'
import { useAppSelector } from '@/store'
import { createAuthenticatedUser } from '@/utils/auth'
import { router } from 'expo-router'
import 'react-native-get-random-values'
import { supabase } from '@/utils/supabase'
import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '@/store'
import { trackSignIn } from '@/utils/appsFlyerEvents'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '@/utils/api'

interface SignInStepProps {
  onBack: () => void;
  onNext: () => void;
}

const selectUserData = createSelector(
  (state: RootState) => state.user,
  (user) => ({
    gender: user.gender,
    birth_date: user.birth_date,
    height: user.height,
    weight: user.weight,
    target_weight: user.target_weight,
    goal: user.goal,
    workout_frequency: user.workout_frequency,
    has_previous_experience: user.has_previous_experience,
    accomplishment: user.accomplishment,
    diet: user.diet,
    pace: user.pace,
    notification_enabled: user.notification_enabled,
    weekly_weight_goal: user.weekly_weight_goal,
    daily_calorie_goal: user.daily_calorie_goal,
    protein_goal: user.protein_goal,
    carbs_goal: user.carbs_goal,
    fats_goal: user.fats_goal,
    workout_plan: user.workout_plan,
  })
)

export default function SignInStep({ onBack, onNext }: SignInStepProps) {
  const userData = useAppSelector(selectUserData);
  const [showPaywall, setShowPaywall] = React.useState(false);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const features = await api.features.getFeatures();
        setShowPaywall(features.paywall);
      } catch (error) {
        console.error('Error loading features:', error);
        setShowPaywall(false);
      }
    };
    loadFeatures();
  }, []);

  const handleAuthSuccess = async (authUser: any) => {
    try {
      // Verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Failed to establish session')
      }

      // Create authenticated user with onboarding data
      await createAuthenticatedUser(userData, authUser);

      // Track successful sign-in
      trackSignIn(authUser.app_metadata?.provider || 'email');

      // Double check session is still valid
      const { data: { session: finalSession } } = await supabase.auth.getSession()
      if (!finalSession) {
        throw new Error('Session lost after user creation')
      }

      if (showPaywall) {
        // If paywall is enabled, proceed to paywall step
        onNext();
      } else {
        // If paywall is disabled, complete onboarding and redirect
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error creating authenticated user:', error)
      Alert.alert('Error', 'Failed to create user profile')
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Sign In
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Sign in to sync your data across devices and never lose your progress
      </Text>
      
      <View style={styles.authContainer}>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </View>

      {/* <Button
        mode="text"
        onPress={handleSkip}
        style={styles.skipButton}
      >
        Skip for now
      </Button> */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  authContainer: {
    marginVertical: 20,
  },
  skipButton: {
    marginTop: 20,
  },
})
