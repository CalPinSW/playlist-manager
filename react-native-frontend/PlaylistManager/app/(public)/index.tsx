import { TouchableOpacity, ActivityIndicator, useColorScheme } from "react-native";
import { Text, View } from '@/components/Themed';
import { useAuth } from "../../contexts/authContext";
import React from "react";
import { StyleSheet } from 'react-native';
import { useColorTheme } from "../../hooks/useColorTheme";

export default function Home() {
  const { signIn, isLoading, error } = useAuth()
  const theme = useColorTheme();
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} noBackground>Welcome to Playlist Manager</Text>
        <Text style={styles.subtitle} noBackground>Sign in to continue</Text>
        <TouchableOpacity
          style={[styles.button, {backgroundColor: theme.primary.default}]}
          onPress={signIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.text.primary} />
          ) : (
            <Text noBackground style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {error && (
          <Text noBackground style={[styles.errorText, {color: theme.warning.default}]}>{error.message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  button: {
    padding: 10,
    borderRadius: 4,
    minWidth: 100,
    margin: 15
  },
  buttonText: {
    margin: "auto",
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});