import { Stack } from 'expo-router';
import { DARK_BLUE } from '@example/shared/utils';

/**
 * A nested stack navigator with a single screen.
 * Used to test sheet auto-dismiss when the parent route is removed.
 */
export default function TestStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: DARK_BLUE },
        headerTintColor: 'white',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Test Stack' }} />
    </Stack>
  );
}
