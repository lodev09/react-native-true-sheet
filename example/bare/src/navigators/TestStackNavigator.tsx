import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TestScreen } from '@example/shared/screens';
import { LARGE_TITLE_HEADER_OPTIONS } from '@example/shared/utils';

type NestedStackParamList = {
  Test: undefined;
};

const Stack = createNativeStackNavigator<NestedStackParamList>();

const TestScreenWrapper = () => {
  const navigation = useNavigation<NativeStackNavigationProp<NestedStackParamList>>();
  return <TestScreen onGoBack={() => navigation.goBack()} />;
};

/**
 * A nested stack navigator with a single screen.
 * Used to test sheet auto-dismiss when the parent route is removed.
 */
export const TestStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: 'white',
      }}
    >
      <Stack.Screen
        name="Test"
        component={TestScreenWrapper}
        options={{
          title: 'Nested Stack',
          ...LARGE_TITLE_HEADER_OPTIONS,
        }}
      />
    </Stack.Navigator>
  );
};
