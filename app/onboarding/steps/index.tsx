import { Redirect } from 'expo-router';

export default function OnboardingStepsIndex() {
  // Redirect to the main onboarding flow
  return <Redirect href="/onboarding" />;
} 