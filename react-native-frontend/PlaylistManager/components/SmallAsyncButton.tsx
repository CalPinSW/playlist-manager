import React, { FC, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useColorTheme } from '../hooks/useColorTheme';

interface SmallAsyncButtonProps {
    onPressAsync: () => Promise<void>
    children: React.ReactNode
    disabled?: boolean
}

const SmallAsyncButton: FC<SmallAsyncButtonProps> = ({ onPressAsync, children, disabled}) => {
  const [loading, setLoading] = useState(false);
  const theme = useColorTheme()

  const handlePress = async () => {
    setLoading(true);
    try {
      await onPressAsync();
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.text.primary} />
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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

export default SmallAsyncButton;
