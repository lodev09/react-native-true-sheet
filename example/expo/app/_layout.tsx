import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { TrueSheetProvider } from '@lodev09/react-native-true-sheet';
import { DARK_BLUE } from '@example/shared/utils';
import 'react-native-reanimated';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TrueSheetProvider>
        <Stack
          screenOptions={{ headerTintColor: 'white', headerStyle: { backgroundColor: DARK_BLUE } }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="standard" options={{ headerShown: false, title: 'Standard' }} />
          <Stack.Screen name="test" options={{ title: 'Test' }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="sheet"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
        </Stack>
      </TrueSheetProvider>
    </ThemeProvider>
  );
}
