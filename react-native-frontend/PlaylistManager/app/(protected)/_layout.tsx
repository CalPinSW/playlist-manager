import { Pressable, Text } from 'react-native';
import { Redirect, Slot, Stack, useRouter } from 'expo-router';
import { PlaybackContextProvider } from '../../contexts/playbackContext';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/sessionContext';
import { useClientOnlyValue } from '../../components/useClientOnlyValue';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '../../hooks/useColorTheme';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter()
  const theme = useColorTheme();
  // You can keep the splash screen open, or render a loading screen like we do here.
  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(public)');
    }
  }, [user, isLoading]);

  if (isLoading || !user) return null;

  // This layout can be deferred because it's not the root layout.
  
  return (
    <PlaybackContextProvider>
      <Stack
            screenOptions={{
              headerRight: () => <Pressable onPress={() => {router.navigate('/userSettings')}}><Ionicons size={28} name="person" color={theme.text.primary} /></Pressable>,
              headerTitle: "Playlist Manager"
            }}
      >
        <Stack.Screen name="index" options={{headerStyle: {backgroundColor: "red"}}}/>
        <Stack.Screen name="userSettings" options={{headerTitle: "Profile", headerStyle: {backgroundColor: "blue"}}}/>
        <Stack.Screen name="two"/>
    </Stack>
  </PlaybackContextProvider>)
}
