import { Pressable, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { PlaybackContextProvider } from '../../contexts/playbackContext';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/authContext';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '../../hooks/useColorTheme';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter()
  const theme = useColorTheme();
  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(public)');
    }
  }, [user, isLoading]);

  if (isLoading || !user) return null;
  
  return (
    <PlaybackContextProvider>
      <Stack
            screenOptions={{
              headerRight: () => 
                <TouchableOpacity onPressIn={() => router.navigate('/userSettings')}>
                  <Ionicons size={28} name="person" color={theme.text.primary} />
                </TouchableOpacity>,
              headerTitle: "Playlist Manager"
            }}
      >
        <Stack.Screen name="index" options={{headerStyle: {}}}/>
        <Stack.Screen name="userSettings" options={{headerTitle: "Profile", headerStyle: {}}}/>
        <Stack.Screen name="two"/>
    </Stack>
  </PlaybackContextProvider>)
}
