import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MapScreen, StandardScreen, TestScreen } from '../screens';
import { ModalStackNavigator } from './ModalStackNavigator';
import { SheetNavigator } from './SheetNavigator';
import type { AppStackParamList } from '../types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerTransparent: true, headerTintColor: 'white' }}
      initialRouteName="Home"
    >
      <Stack.Screen options={{ headerShown: false }} name="Home" component={SheetNavigator} />
      <Stack.Screen options={{ headerShown: false }} name="Map" component={MapScreen} />
      <Stack.Screen
        options={{ headerShown: false, title: 'Home' }}
        name="Standard"
        component={StandardScreen}
      />
      <Stack.Screen name="Test" component={TestScreen} />
      <Stack.Screen
        name="ModalStack"
        component={ModalStackNavigator}
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
    </Stack.Navigator>
  );
};
