import { Stack } from 'expo-router';
import { Colors } from '../../../constants/colors';

// Keeps the playlist list beneath a playlist opened from outside this tab (see
// the withAnchor push on the Now tab), so it always has something to go back to.
export const unstable_settings = {
  initialRouteName: 'index'
};

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
        headerTitleStyle: { color: Colors.text, fontWeight: '600', fontSize: 16 },
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
