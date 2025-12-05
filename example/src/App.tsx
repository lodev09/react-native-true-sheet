import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  MapScreen,
  NavigationScreen,
  TestScreen,
  ModalScreen,
  SheetNavigatorScreen,
} from './screens';
import type { AppStackParamList, ModalStackParamList } from './types';
import { ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet/reanimated';

const DEFAULT_NAVIGATION: keyof AppStackParamList = 'Map';

const Stack = createNativeStackNavigator<AppStackParamList>();
const ModalStack = createNativeStackNavigator<ModalStackParamList>();

const ModalStackScreen = () => {
  return (
    <ModalStack.Navigator screenOptions={{ headerTransparent: true, headerTintColor: 'white' }}>
      <ModalStack.Screen name="Modal" component={ModalScreen} />
      <ModalStack.Screen name="Test" component={TestScreen} />
    </ModalStack.Navigator>
  );
};

const App = () => {
  return (
    <ReanimatedTrueSheetProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerTransparent: true, headerTintColor: 'white' }}
          initialRouteName={DEFAULT_NAVIGATION}
        >
          <Stack.Screen options={{ headerShown: false }} name="Map" component={MapScreen} />
          <Stack.Screen
            options={{ headerShown: false, title: 'Home' }}
            name="Navigation"
            component={NavigationScreen}
          />
          <Stack.Screen name="Test" component={TestScreen} />
          <Stack.Screen
            name="ModalStack"
            component={ModalStackScreen}
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen
            name="SheetNavigator"
            component={SheetNavigatorScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ReanimatedTrueSheetProvider>
  );
};

export default App;
