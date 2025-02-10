import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import commonStyles from '../styles';
import Superwall, { PaywallInfo } from '@superwall/react-native-superwall';
import { router } from 'expo-router';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackSubscription } from '@/utils/appsFlyerEvents';

interface PaywallStepProps {
  onBack?: () => void;
  onNext: () => void;
}

export function PaywallStep({ onBack, onNext }: PaywallStepProps) {

  useEffect(() => {
    const presentPaywall = async () => {
      try {
        await Superwall.shared.register('campaign_trigger', undefined, {
          // Handlers not working but for some reason requred to be here
          onPresent: () => {},
          onDismiss: () => {},
          onError: (error) => {},
          onSkip: () => {},
          // Handlers not working but for some reason requred to be here

          // Working Handlers
          onDismissHandler: async (event: PaywallInfo) => {
            trackSubscription(event);
            console.log('onDismissHandler Paywall dismissed by user');
            await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
            router.replace('/(tabs)');
          },
          onErrorHandler: (error) => {
            console.error('onErrorHandler Paywall presentation error:', error);
            router.replace('/onboarding');
          },
          onSkipHandler: () => {
            console.log('onSkipHandler Paywall skipped by user');
            router.replace('/(tabs)');
          },
          onPresentHandler: () => {
            console.log('onPresentHandler Paywall presented successfully');
          },
        });
      } catch (error) {
        console.error('Critical error presenting paywall:', error);
        router.replace('/onboarding');
      }
    };

    presentPaywall();
  }, []);

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner />
      </View>
    </SafeAreaView>
  );
}

export default PaywallStep; 