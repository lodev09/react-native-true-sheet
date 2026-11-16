import { Stack } from 'expo-router';

import { DARK_BLUE } from '@example/shared/utils';

export default function ReproTabStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: 'white',
        headerStyle: { backgroundColor: DARK_BLUE },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Stack in Tab' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
    </Stack>
  );
}
