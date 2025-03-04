import { Platform, Alert, StyleSheet, View } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '@/utils/supabase'
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin'
import { useEffect } from 'react'
import React from 'react'

interface AuthProps {
  onAuthSuccess?: (user: {
    id: string;
    email: string;
    name?: string;
  }) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  useEffect(() => {
    if (Platform.OS === 'android') {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      });
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      if (tokens.idToken) {
        const { error: signInError, data: signInData } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: tokens.idToken,
        });

        if (signInError) {
          Alert.alert('Error', signInError.message);
          console.error('Supabase auth error:', signInError);
          return;
        }

        // Verify session is established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          Alert.alert('Error', 'Failed to establish session');
          return;
        }

        if (signInData.user) {
          const user = {
            id: signInData.user.id,
            email: signInData.user.email!,
            name: signInData.user.user_metadata?.name || signInData.user.user_metadata?.full_name || undefined,
          };
          onAuthSuccess?.(user);
        }
      }
    } catch (e: any) {
      if (e.code === 5) {
        console.log('Sign in canceled');
      } else {
        Alert.alert('Error', 'An error occurred during sign in');
        console.error('Sign in error:', e);
      }
    }
  };

  if (Platform.OS === 'ios')
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={26}
        style={{ width: 280, height: 80 }}
        onPress={async () => {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            })

            if (credential.identityToken) {
              const { error: signInError, data: signInData } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
              })

              if (signInError) {
                Alert.alert('Error', signInError.message)
                console.error('Supabase auth error:', signInError)
                return
              }

              // Verify session is established
              const { data: { session }, error: sessionError } = await supabase.auth.getSession()
              
              if (sessionError || !session) {
                Alert.alert('Error', 'Failed to establish session')
                return
              }

              if (signInData.user) {
                const user = {
                  id: signInData.user.id,
                  email: signInData.user.email!,
                  name: credential.fullName 
                    ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
                    : undefined,
                }
                onAuthSuccess?.(user)
              }
            }
          } catch (e: any) {
            if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_REQUEST_CANCELED') {
              console.log('Sign in canceled')
            } else {
              Alert.alert('Error', 'An error occurred during sign in')
              console.error('Sign in error:', e)
            }
          }
        }}
      />
    )
   
  return (
    <View style={styles.container}>
      <GoogleSigninButton
        style={styles.googleButton}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={handleGoogleSignIn}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    width: 280,
    height: 65,
  },
})