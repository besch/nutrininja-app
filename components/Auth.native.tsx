import { Platform, Alert } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '@/utils/supabase'

interface AuthProps {
  onAuthSuccess?: (user: {
    id: string;
    email: string;
    name?: string;
  }) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
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
          } catch (e: unknown) {
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
  return <>{/* Implement Android Auth options */}</>
}