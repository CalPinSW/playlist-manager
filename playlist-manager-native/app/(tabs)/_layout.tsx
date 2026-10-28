import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

/**
 * Tab bar layout — 4 tabs with thin-stroke Feather icons.
 * Active tab = accent icon + a short accent bar above it (echoing the
 * segmented progress bars); inactive = muted. Feather has no filled
 * variants, so state is carried by colour and the bar, not icon swaps.
 * Portrait lock is set in app.json (orientation: 'portrait').
 */
export default function TabLayout() {
  // react-navigation only adds the bottom safe-area inset to the tab bar's
  // height/padding automatically when tabBarStyle has no explicit height —
  // since we set a fixed height for a consistent look, we have to add
  // insets.bottom ourselves or the tab bar sits under the home indicator /
  // Android gesture bar (app.json has android.edgeToEdgeEnabled: true).
  const insets = useSafeAreaInsets();

  const makeIcon = (name: FeatherName) => {
    function TabIcon({ focused, color }: { focused: boolean; color: string }) {
      return (
        <View style={styles.iconWrap}>
          <View style={[styles.indicator, focused && styles.indicatorActive]} />
          <Feather name={name} size={21} color={color} />
        </View>
      );
    }
    TabIcon.displayName = `TabIcon(${name})`;
    return TabIcon;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textFaint,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.divider,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 62 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Now',
          tabBarAccessibilityLabel: 'Now Playing tab',
          tabBarIcon: makeIcon('disc'),
        }}
      />
      <Tabs.Screen
        name="albums"
        options={{
          title: 'Albums',
          tabBarAccessibilityLabel: 'Albums tab — browse playlists and albums',
          tabBarIcon: makeIcon('layers'),
        }}
      />
      <Tabs.Screen
        name="ratings"
        options={{
          title: 'Ratings',
          tabBarAccessibilityLabel: 'Ratings tab — your rated albums',
          tabBarIcon: makeIcon('star'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab',
          tabBarIcon: makeIcon('sliders'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center' },
  indicator: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 7,
    backgroundColor: 'transparent',
  },
  indicatorActive: { backgroundColor: Colors.accent },
});
