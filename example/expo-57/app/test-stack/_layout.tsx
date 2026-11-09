import { Stack } from 'expo-router';
import { LARGE_TITLE_HEADER_OPTIONS } from '@example/shared/utils';

/**
 * A nested stack navigator with a single screen.
 * Used to test sheet auto-dismiss when the parent route is removed.
 */
export default function TestStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: 'white',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Test Stack',
          ...LARGE_TITLE_HEADER_OPTIONS,
        }}
      />
    </Stack>
  );
}
