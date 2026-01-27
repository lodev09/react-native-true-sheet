import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MapScreen, StandardScreen, TestScreen } from '@example/shared/screens';
import { DARK_BLUE } from '@example/shared/utils';
import { Map } from '@example/shared/components';
import { ModalStackNavigator } from './ModalStackNavigator';
import { SheetNavigator } from './SheetNavigator';
import { TestStackNavigator } from './TestStackNavigator';
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
      onNavigateToTest={() => navigation.navigate('Test')}
      onNavigateToTestStack={() => navigation.navigate('TestStack')}
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

const TestScreenWrapper = () => {
  const navigation = useAppNavigation();
  return <TestScreen onGoBack={() => navigation.goBack()} />;
};

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerTintColor: 'white', headerStyle: { backgroundColor: DARK_BLUE } }}
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
      <Stack.Screen
        name="ModalStack"
        component={ModalStackNavigator}
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
      <Stack.Screen name="Test" component={TestScreenWrapper} options={{ title: 'Test' }} />
      <Stack.Screen
        name="TestStack"
        component={TestStackNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
