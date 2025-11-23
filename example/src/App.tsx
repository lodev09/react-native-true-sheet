import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MapScreen, NavigationScreen, ChildScreen, ModalScreen } from './screens';
import type { AppStackParamList } from './types';
import { ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet';

const Stack = createNativeStackNavigator<AppStackParamList>();

const App = () => {
  return (
    <ReanimatedTrueSheetProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerTransparent: true, headerTintColor: 'white' }}
          initialRouteName="Navigation"
        >
          <Stack.Screen options={{ headerShown: false }} name="Map" component={MapScreen} />
          <Stack.Screen
            options={{ headerShown: false, title: 'Home' }}
            name="Navigation"
            component={NavigationScreen}
          />
          <Stack.Screen name="Child" component={ChildScreen} />
          <Stack.Screen name="Modal" component={ModalScreen} options={{ presentation: 'modal' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ReanimatedTrueSheetProvider>
  );
};

export default App;
