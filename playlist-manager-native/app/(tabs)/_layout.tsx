import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Tab bar layout — 4 tabs with Ionicons.
 * Filled icons = active, outline = inactive.
 * Portrait lock is set in app.json (orientation: 'portrait').
 */
export default function TabLayout() {
  // react-navigation only adds the bottom safe-area inset to the tab bar's
  // height/padding automatically when tabBarStyle has no explicit height —
  // since we set a fixed height for a consistent look, we have to add
  // insets.bottom ourselves or the tab bar sits under the home indicator /
  // Android gesture bar (app.json has android.edgeToEdgeEnabled: true).
  const insets = useSafeAreaInsets();

  const makeIcon = (active: IoniconName, inactive: IoniconName) => {
    function TabIcon({ focused, color }: { focused: boolean; color: string }) {
      return <Ionicons name={focused ? active : inactive} size={24} color={color} />;
    }
    TabIcon.displayName = `TabIcon(${active})`;
    return TabIcon;
  };

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
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
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
