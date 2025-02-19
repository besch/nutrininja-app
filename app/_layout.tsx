import { Stack, useSegments } from "expo-router";
import { Provider } from "react-redux";
import { store, AppDispatch } from "@/store";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { fetchUserData } from "@/store/userSlice";
import { ThemeProvider } from "@rneui/themed";
import { theme } from "@/theme";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  useFonts,
  Oswald_400Regular,
  Oswald_600SemiBold,
} from '@expo-google-fonts/oswald';
import * as SplashScreen from 'expo-splash-screen';
import Superwall from "@superwall/react-native-superwall"
import Purchases from 'react-native-purchases';
import { Platform } from "react-native";
import { supabase } from "@/utils/supabase";
import appsFlyer from 'react-native-appsflyer';
import { Settings } from 'react-native-fbsdk-next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import * as Notifications from 'expo-notifications';
// import { registerForPushNotificationsAsync } from '../utils/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const segments = useSegments();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        dispatch(fetchUserData());
      }
    };

    checkSessionAndFetchData();
  }, [dispatch, segments]);

  useEffect(() => {
    // Initialize Facebook SDK
    Settings.initializeSDK();
    Settings.setAdvertiserTrackingEnabled(true);

    // Initialize RevenueCat
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY as string });
    }
    Superwall.configure(process.env.EXPO_PUBLIC_SUPERWALL_API_KEY as string)
  }, []);

  useEffect(() => {

    const appsFlyerConfig = {
      devKey: process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY as string,
      isDebug: true,
      appId: process.env.EXPO_PUBLIC_APP_ID as string,
    };

    appsFlyer.initSdk(
      appsFlyerConfig,
      (result) => {
        console.log('AppsFlyer initialization successful:', result);
        appsFlyer.startSdk();
      },
      (error) => {
        console.error('AppsFlyer initialization failed:', error);
      }
    );
  }, []);

  return (
    <Stack screenOptions={{
      headerBackTitle: "Back",
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }}/>
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }}/>
      <Stack.Screen name="onboarding/steps/index" options={{ headerShown: false }}/>
      <Stack.Screen name="onboarding" options={{ headerShown: false }}/>
      <Stack.Screen
        name="(tabs)"
        options={{ gestureEnabled: false, headerShown: false }}
      />
      <Stack.Screen
        name="main"
        options={() => {
          const routeName = segments[1] || '';
          
          const titles: Record<string, string> = {
            'personal-details': 'Personal Details',
            'adjust-goals': 'Adjust Goals',
            'camera': 'Take Photo',
            'food-details': 'Food Details',
            'terms': 'Terms and Conditions',
            'privacy': 'Privacy Policy',
          };
          
          return {
            headerTitle: titles[routeName] || 'Main',
          };
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Oswald': Oswald_400Regular,
    'Oswald-SemiBold': Oswald_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // useEffect(() => {
  //   registerForPushNotificationsAsync().then(token => {
  //     if (token) {
  //       console.log('Push Notification Token:', token);
  //       // TODO: Send this token to your backend server
  //     }
  //   });

  //   notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
  //     // Handle received notification
  //     console.log('Received notification:', notification);
  //   });

  //   responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  //     // Handle notification response (when user taps notification)
  //     console.log('Notification response:', response);
  //   });

  //   return () => {
  //     if (notificationListener.current) {
  //       Notifications.removeNotificationSubscription(notificationListener.current);
  //     }
  //     if (responseListener.current) {
  //       Notifications.removeNotificationSubscription(responseListener.current);
  //     }
  //   };
  // }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <ErrorBoundary>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: Platform.OS === "ios" ? "default" : "slide_from_right",
                  animationDuration: 200,
                }}
              >
                <AppContent />
              </Stack>
            </ErrorBoundary>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
