import { NavigationContainer } from '@react-navigation/native';
import { ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet/reanimated';
import { MapProvider } from '@lugg/maps';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';

import { RootNavigator } from './navigators';

const App = () => {
  return (
    <MapProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <ReanimatedTrueSheetProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ReanimatedTrueSheetProvider>
    </MapProvider>
  );
};

export default App;
