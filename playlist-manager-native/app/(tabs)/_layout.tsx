import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Tab bar layout — 4 tabs with Ionicons.
 * Filled icons = active, outline = inactive.
 * Portrait lock is set in app.json (orientation: 'portrait').
 */
export default function TabLayout() {
  const makeIcon = (active: IoniconName, inactive: IoniconName) =>
    ({ focused, color }: { focused: boolean; color: string }) => (
      <Ionicons name={focused ? active : inactive} size={24} color={color} />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBackground,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Now Playing',
          tabBarAccessibilityLabel: 'Now Playing tab',
          tabBarIcon: makeIcon('headset', 'headset-outline'),
        }}
      />
      <Tabs.Screen
        name="albums"
        options={{
          title: 'Albums',
          tabBarAccessibilityLabel: 'Albums tab — browse playlists and albums',
          tabBarIcon: makeIcon('albums', 'albums-outline'),
        }}
      />
      <Tabs.Screen
        name="ratings"
        options={{
          title: 'Ratings',
          tabBarAccessibilityLabel: 'Ratings tab — your rated albums',
          tabBarIcon: makeIcon('star', 'star-outline'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab',
          tabBarIcon: makeIcon('settings', 'settings-outline'),
        }}
      />
    </Tabs>
  );
}
