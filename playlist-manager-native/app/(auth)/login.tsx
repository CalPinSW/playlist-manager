import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthRequest, exchangeCodeAsync } from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { discovery, authRequestConfig, saveTokens } from '../../lib/auth';
import { syncHistory } from '../../lib/api';
import { Colors } from '../../constants/colors';

/**
 * Login screen — Auth0 PKCE flow.
 *
 * Pressing "Sign in" opens Auth0's Universal Login in an in-app browser.
 * On success, we exchange the auth code for tokens, store them in SecureStore,
 * trigger a history sync, then navigate to the main app.
 */
export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = useAuthRequest(authRequestConfig, discovery);

  useEffect(() => {
    if (response?.type !== 'success') return;

    const { code } = response.params;
    if (!code || !request?.codeVerifier) return;

    setLoading(true);

    exchangeCodeAsync(
      {
        clientId: authRequestConfig.clientId,
        code,
        redirectUri: authRequestConfig.redirectUri,
        codeVerifier: request.codeVerifier,
        extraParams: authRequestConfig.additionalParameters
      },
      discovery
    )
      .then(async (tokenResponse) => {
        await saveTokens({
          access_token: tokenResponse.accessToken,
          refresh_token: tokenResponse.refreshToken ?? undefined,
          expires_in: tokenResponse.expiresIn ?? 3600,
          id_token: tokenResponse.idToken ?? undefined
        });

        // Fire sync on first login — don't block navigation on it.
        syncHistory().catch(() => null);

        router.replace('/(tabs)');
      })
      .catch((err) => {
        Alert.alert('Sign in failed', err.message ?? 'Unknown error');
        setLoading(false);
      });
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Playlist{'\n'}Manager</Text>
      <Text style={styles.subtitle}>Your personal listening OS</Text>

      <TouchableOpacity
        style={[styles.button, (!request || loading) && styles.buttonDisabled]}
        disabled={!request || loading}
        onPress={() => promptAsync()}
        accessibilityLabel="Sign in with Auth0"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={Colors.text} />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 54,
    marginBottom: 12
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 48
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600'
  }
});
