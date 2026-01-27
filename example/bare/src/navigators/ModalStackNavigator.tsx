import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ModalScreen, TestScreen } from '@example/shared/screens';
import type { ModalStackParamList } from '../types';
import { DARK_BLUE } from '@example/shared';

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

const TestScreenWrapper = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ModalStackParamList>>();
  return <TestScreen onGoBack={() => navigation.goBack()} />;
};

export const ModalStackNavigator = () => {
  return (
    <ModalStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: DARK_BLUE },
        headerTintColor: 'white',
      }}
    >
      <ModalStack.Screen name="Modal" component={ModalScreenWrapper} />
      <ModalStack.Screen name="Test" component={TestScreenWrapper} />
    </ModalStack.Navigator>
  );
};
