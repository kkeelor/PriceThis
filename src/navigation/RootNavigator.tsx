import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { CameraScreen } from '@/screens/CameraScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
