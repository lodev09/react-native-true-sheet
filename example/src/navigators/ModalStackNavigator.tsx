import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ModalScreen, TestScreen } from '../screens';
import type { ModalStackParamList } from '../types';

const ModalStack = createNativeStackNavigator<ModalStackParamList>();

export const ModalStackNavigator = () => {
  return (
    <ModalStack.Navigator screenOptions={{ headerTransparent: true, headerTintColor: 'white' }}>
      <ModalStack.Screen name="Modal" component={ModalScreen} />
      <ModalStack.Screen name="Test" component={TestScreen} />
    </ModalStack.Navigator>
  );
};
