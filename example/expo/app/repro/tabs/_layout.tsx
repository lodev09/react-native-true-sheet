import { Tabs } from 'expo-router/js-tabs';

import { DARK_BLUE } from '@example/shared/utils';

// Sheets hosted in a tab screen, a stack inside a tab, and a nested stack, with
// the enclosing stack pushing over them. Open with `yarn expo open repro/tabs`.
export default function ReproTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTintColor: 'white',
        headerStyle: { backgroundColor: DARK_BLUE },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tab' }} />
      <Tabs.Screen name="stack" options={{ title: 'Stack', headerShown: false }} />
    </Tabs>
  );
}
