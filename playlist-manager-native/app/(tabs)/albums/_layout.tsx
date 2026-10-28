import { Stack } from 'expo-router';
import { Colors } from '../../../constants/colors';

/**
 * Stack navigator for the Albums tab.
 * index → playlist detail → (album detail is root-level Stack in _layout.tsx)
 */
export default function AlbumsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.accent,
        headerTitle: '',
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: Colors.bg }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[playlistId]" options={{ headerBackTitle: 'Albums' }} />
    </Stack>
  );
}
