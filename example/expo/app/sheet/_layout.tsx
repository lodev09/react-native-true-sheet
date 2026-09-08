import { Platform, StyleSheet } from 'react-native';
import { Sheet } from '@lodev09/react-native-true-sheet/navigation/expo-router';

import { Footer, Header } from '@example/shared/components';
import { DARK, DARK_GRAY } from '@example/shared/utils';
import { TrueSheetProvider } from '@lodev09/react-native-true-sheet';

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
        initialRouteName="(home)"
      >
        <Sheet.Screen name="(home)" />
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
        <Sheet.Screen
          name="profile"
          options={{
            detents: ['auto', 1],
            backgroundColor: DARK,
            cornerRadius: 16,
          }}
        />
        <Sheet.Screen
          name="notifications"
          options={{
            detents: ['auto', 1],
            backgroundColor: DARK,
            cornerRadius: 16,
          }}
        />
        <Sheet.Screen
          name="scrollable"
          options={{
            detents: [0.6, 1],
            backgroundColor: DARK,
            cornerRadius: 16,
            style: styles.scrollableSheet,
            header: <Header />,
            headerOptions: { position: 'absolute' },
            footer: <Footer />,
            footerStyle: styles.scrollableFooter,
            footerOptions: { position: 'absolute' },
            scrollableOptions: {
              topScrollEdgeEffect: 'soft',
              bottomScrollEdgeEffect: 'soft',
            },
          }}
        />
        <Sheet.Screen
          name="small-footer"
          options={{
            detents: ['auto'],
            backgroundColor: DARK,
            cornerRadius: 16,
          }}
        />
      </Sheet>
    </TrueSheetProvider>
  );
}

const styles = StyleSheet.create({
  scrollableSheet: {
    flex: 1,
  },
  // Transparent on iOS so the scroll edge effect shows through
  scrollableFooter: {
    backgroundColor: Platform.select({ default: DARK_GRAY, ios: undefined }),
  },
});
