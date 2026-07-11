import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Heart } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import type { MainTabParamList } from '@/navigation/types';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { typography } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { colors, isDark } = useTheme();

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
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
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
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
  );
}
