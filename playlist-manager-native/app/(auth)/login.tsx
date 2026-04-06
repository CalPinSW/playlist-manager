import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthRequest } from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { discovery, authRequestConfig, exchangeCodeForTokens } from '../../lib/auth';
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
    if (!code) {
      Alert.alert('Sign in failed', 'No authorization code received');
      return;
    }

    if (!request?.codeVerifier) {
      Alert.alert('Sign in failed', 'Missing code verifier - please try again');
      return;
    }

    setLoading(true);

    console.log('Exchanging code for tokens with verifier:', request.codeVerifier.substring(0, 10) + '...');

    exchangeCodeForTokens(code, request.codeVerifier)
      .then(async () => {
        // Fire sync on first login — don't block navigation on it.
        syncHistory().catch(() => null);

        router.replace('/(tabs)');
      })
      .catch((err) => {
        console.error('Token exchange error:', err);
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
