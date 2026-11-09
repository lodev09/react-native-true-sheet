import { Stack } from 'expo-router';

import { DARK_BLUE } from '@example/shared/utils';

export default function ReproNestedLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: 'white',
        headerStyle: { backgroundColor: DARK_BLUE },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Nested Stack' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
    </Stack>
  );
}
