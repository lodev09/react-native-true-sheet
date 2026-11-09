import { DARK_BLUE } from '@example/shared/utils';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{ headerStyle: { backgroundColor: DARK_BLUE }, headerTintColor: 'white' }}
    />
  );
}
