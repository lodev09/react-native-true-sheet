import { withLayoutContext } from 'expo-router';
import { createTrueSheetNavigator } from '@lodev09/react-native-true-sheet/navigation';

import { DARK } from '@example/shared/utils';
import { TrueSheetProvider } from '@lodev09/react-native-true-sheet';

const { Navigator } = createTrueSheetNavigator();

export const Sheet = withLayoutContext(Navigator);

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function SheetStackLayout() {
  return (
    <TrueSheetProvider>
      <Sheet
        screenListeners={{
          sheetWillPresent: (e) => {
            console.log(`[SheetNavigator] sheetWillPresent: index=${e.data.index}`);
          },
          sheetDidPresent: (e) => {
            console.log(`[SheetNavigator] sheetDidPresent: index=${e.data.index}`);
          },
          sheetWillDismiss: () => {
            console.log('[SheetNavigator] sheetWillDismiss');
          },
          sheetDidDismiss: () => {
            console.log('[SheetNavigator] sheetDidDismiss');
          },
          sheetDetentChange: (e) => {
            console.log(`[SheetNavigator] sheetDetentChange: index=${e.data.index}`);
          },
          sheetDragBegin: (e) => {
            console.log(`[SheetNavigator] sheetDragBegin: index=${e.data.index}`);
          },
          sheetDragChange: (e) => {
            console.log(`[SheetNavigator] sheetDragChange: position=${e.data.position.toFixed(0)}`);
          },
          sheetDragEnd: (e) => {
            console.log(`[SheetNavigator] sheetDragEnd: index=${e.data.index}`);
          },
          sheetWillFocus: () => {
            console.log('[SheetNavigator] sheetWillFocus');
          },
          sheetDidFocus: () => {
            console.log('[SheetNavigator] sheetDidFocus');
          },
          sheetWillBlur: () => {
            console.log('[SheetNavigator] sheetWillBlur');
          },
          sheetDidBlur: () => {
            console.log('[SheetNavigator] sheetDidBlur');
          },
        }}
      >
        <Sheet.Screen name="index" />
        <Sheet.Screen
          name="details"
          options={{
            detents: ['auto', 1],
            cornerRadius: 16,
          }}
        />
        <Sheet.Screen
          name="settings"
          options={{
            detents: ['auto', 1],
            backgroundColor: DARK,
            cornerRadius: 16,
          }}
        />
      </Sheet>
    </TrueSheetProvider>
  );
}
