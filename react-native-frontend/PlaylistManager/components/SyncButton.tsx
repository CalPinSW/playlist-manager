import React, { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorTheme } from '../hooks/useColorTheme';

interface SyncButtonProps {
    onPress: () => void;
    text: string;
    disabled?: boolean;
}

const SyncButton: FC<SyncButtonProps> = ({ onPress, text, disabled}) => {
  const theme = useColorTheme()

  return (
    <View style={styles.container}>
      <TouchableOpacity
        disabled
        style={[styles.button, {backgroundColor: disabled ? theme.background.interactive : theme.primary.default}]}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>{text}</Text>
      </TouchableOpacity>
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

export default SyncButton;
