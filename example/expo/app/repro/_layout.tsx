import { Stack } from 'expo-router';

import { DARK_BLUE } from '@example/shared/utils';

// Cold start deep link repros — nothing in the app links here. Open with e.g.
// `yarn expo open repro/modal` after terminating the app.
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function ReproLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: 'white',
        headerStyle: { backgroundColor: DARK_BLUE },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Repro' }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
      <Stack.Screen name="page-sheet" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="sheet" options={{ headerShown: false }} />
    </Stack>
  );
}
