import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ModalScreen, TestScreen } from '../screens';
import type { ModalStackParamList } from '../types';

const ModalStack = createNativeStackNavigator<ModalStackParamList>();

const ModalScreenWrapper = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ModalStackParamList>>();
  return (
    <ModalScreen
      onNavigateToTest={() => navigation.navigate('Test')}
      onDismiss={() => navigation.goBack()}
    />
  );
};

export const ModalStackNavigator = () => {
  return (
    <ModalStack.Navigator screenOptions={{ headerTransparent: true, headerTintColor: 'white' }}>
      <ModalStack.Screen name="Modal" component={ModalScreenWrapper} />
      <ModalStack.Screen name="Test" component={TestScreen} />
    </ModalStack.Navigator>
  );
};
