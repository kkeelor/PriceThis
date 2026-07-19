import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Heart, History, Home } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import type { MainTabParamList } from '@/navigation/types';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { typography } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = { color: string; size: number };

function HomeTabIcon({ color, size }: TabIconProps) {
  return <Home color={color} size={size} strokeWidth={2} />;
}

function HistoryTabIcon({ color, size }: TabIconProps) {
  return <History color={color} size={size} strokeWidth={2} />;
}

function FavoritesTabIcon({ color, size }: TabIconProps) {
  return <Heart color={color} size={size} strokeWidth={2} />;
}

export function MainTabNavigator() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          borderTopWidth: isDark ? 1 : 0.5,
          minHeight: 52 + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
          fontSize: 11,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: HistoryTabIcon,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: FavoritesTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}
