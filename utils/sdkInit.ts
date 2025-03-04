import { Platform } from 'react-native';
import { Settings } from 'react-native-fbsdk-next';
import Purchases from 'react-native-purchases';
import Superwall from "@superwall/react-native-superwall";
import appsFlyer from 'react-native-appsflyer';

export const initializeFacebookSDK = () => {
  Settings.initializeSDK();
  Settings.setAdvertiserTrackingEnabled(true);
};

export const initializeRevenueCat = () => {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  if (Platform.OS === 'ios') {
    Purchases.configure({
      apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY as string
    });
  }
};

export const initializeSuperwall = () => {
  Superwall.configure(process.env.EXPO_PUBLIC_SUPERWALL_API_KEY as string);
};

export const initializeAppsFlyer = () => {
  const appsFlyerConfig = {
    devKey: process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY as string,
    isDebug: true,
    appId: process.env.EXPO_PUBLIC_APP_ID as string,
  };

  appsFlyer.initSdk(
    appsFlyerConfig,
    (result) => {
      appsFlyer.startSdk();
    },
    (error) => {
      console.error('AppsFlyer initialization failed:', error);
    }
  );
};

export const initializeAllSDKs = () => {
  initializeFacebookSDK();
  initializeRevenueCat();
  initializeSuperwall();
  initializeAppsFlyer();
}; 