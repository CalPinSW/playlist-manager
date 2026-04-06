import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';

/**
 * Tab bar layout — 4 tabs as defined in the design review.
 * Portrait lock is set in app.json (orientation: 'portrait').
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBackground,
          borderTopColor: Colors.border,
          borderTopWidth: 1
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Now',
          tabBarAccessibilityLabel: 'Now tab — current album'
        }}
      />
      <Tabs.Screen
        name="albums"
        options={{
          title: 'Albums',
          tabBarAccessibilityLabel: 'Albums tab — browse playlists and albums'
        }}
      />
      <Tabs.Screen
        name="ratings"
        options={{
          title: 'Ratings',
          tabBarAccessibilityLabel: 'Ratings tab — your rated albums'
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab'
        }}
      />
    </Tabs>
  );
}
