import { NavigationContainer } from '@react-navigation/native';
import { ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet/reanimated';

import { RootNavigator } from './navigators';

const App = () => {
  return (
    <ReanimatedTrueSheetProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ReanimatedTrueSheetProvider>
  );
};

export default App;
