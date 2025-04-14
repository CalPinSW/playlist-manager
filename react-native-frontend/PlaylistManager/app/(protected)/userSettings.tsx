import { StatusBar } from 'expo-status-bar';
import { Button, Platform, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import EditScreenInfo from '@/components/UserSettings/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/sessionContext';
import { useColorTheme } from '../../hooks/useColorTheme';

export default function ModalScreen() {
  const theme = useColorTheme()
  const {signOut, isLoading} = useAuth()

  return (
    <View style={styles.container}>
      <Text noBackground style={styles.title}>User settings</Text>
      <View style={styles.separator}/>
      <EditScreenInfo path="app/modal.tsx" />
      <TouchableOpacity
        style={[styles.button, {backgroundColor: theme.primary.default}]}
        onPress={signOut}
        disabled={isLoading}
      >
        <Text noBackground style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>      
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
