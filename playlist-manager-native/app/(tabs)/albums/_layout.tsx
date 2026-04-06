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
        headerStyle: { backgroundColor: Colors.surfaceDark },
        headerTintColor: Colors.primary,
        headerTitle: '',
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: Colors.surfaceDark }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[playlistId]" options={{ headerBackTitle: 'Albums' }} />
    </Stack>
  );
}
