import React, { FC, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useColorTheme } from '../hooks/useColorTheme';

interface AsyncButtonProps {
    onPressAsync: () => Promise<void>
    text: string
    disabled?: boolean
}

const AsyncButton: FC<AsyncButtonProps> = ({ onPressAsync, text, disabled}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorTheme()

  const handlePress = async () => {
    setLoading(true);
    setError(null);
    try {
      await onPressAsync();
    } catch (err) {
      setError('Something went wrong');
      console.error(err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button,  {backgroundColor: (disabled || loading) ? theme.background.offset : theme.primary.default}]}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.text.primary} />
        ) : (
          <Text style={styles.buttonText}>{text}</Text>
        )}
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, {color: theme.warning.default}]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default AsyncButton;
