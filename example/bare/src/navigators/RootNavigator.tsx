import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MapScreen, StandardScreen, TestScreen } from '@example/shared/screens';
import { Map } from '../components';
import { ModalStackNavigator } from './ModalStackNavigator';
import { SheetNavigator } from './SheetNavigator';
import type { AppStackParamList } from '../types';
import { useAppNavigation } from '../hooks';

const Stack = createNativeStackNavigator<AppStackParamList>();

const INITIAL_ROUTE_NAME: keyof AppStackParamList = 'Map';

const MapScreenWrapper = () => {
  const navigation = useAppNavigation();
  return (
    <MapScreen
      MapComponent={Map}
      onNavigateToModal={() => navigation.navigate('ModalStack')}
      onNavigateToSheetStack={() => navigation.navigate('SheetStack')}
    />
  );
};

const StandardScreenWrapper = () => {
  const navigation = useAppNavigation();
  return (
    <StandardScreen
      onNavigateToTest={() => navigation.navigate('Test')}
      onNavigateToModal={() => navigation.navigate('ModalStack')}
      onNavigateToMap={() => navigation.navigate('Map')}
    />
  );
};

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerTransparent: true, headerTintColor: 'white' }}
      initialRouteName={INITIAL_ROUTE_NAME}
    >
      <Stack.Screen
        options={{ presentation: 'fullScreenModal', headerShown: false }}
        name="SheetStack"
        component={SheetNavigator}
      />
      <Stack.Screen options={{ headerShown: false }} name="Map" component={MapScreenWrapper} />
      <Stack.Screen
        options={{ headerShown: false, title: 'Standard' }}
        name="Standard"
        component={StandardScreenWrapper}
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
