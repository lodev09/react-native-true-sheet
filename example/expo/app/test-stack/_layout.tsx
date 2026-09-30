import { Stack } from 'expo-router';

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
          headerLargeTitleEnabled: true,
          headerLargeTitleStyle: { color: 'white' },
        }}
      />
    </Stack>
  );
}
