import { Pressable, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { PlaybackContextProvider } from '../../contexts/playbackContext';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/authContext';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '../../hooks/useColorTheme';
import MiniPlayer from '../../components/MiniPlayer/Miniplayer';
import { View } from '../../components/Themed';

type PlaylistExplorerParams = {
  id: string;
  name?: string;
}

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
                (<View noBackground style={{display: "flex", flexDirection: "row", gap: 12}}>
                  {/* <TouchableOpacity onPressIn={() => router.navigate('/backgroundTaskManager')}>
                    <Ionicons size={28} name="settings" color={theme.text.primary} />
                  </TouchableOpacity> */}
                  <TouchableOpacity onPressIn={() => router.navigate('/userSettings')}>
                    <Ionicons size={28} name="person" color={theme.text.primary} />
                  </TouchableOpacity>
                </View>),
              headerTitle: "Playlist Manager"
            }}
      >
        <Stack.Screen name="index" options={{headerStyle: {}}}/>
        <Stack.Screen name="userSettings" options={{headerTitle: "Profile", headerStyle: {}}}/>
        <Stack.Screen name="playlist/[id]" options={({route}) => ({headerTitle: (route.params as PlaylistExplorerParams).name ?? "Playlist Explorer"})}/>
    </Stack>
    <MiniPlayer />
  </PlaybackContextProvider>)
}
