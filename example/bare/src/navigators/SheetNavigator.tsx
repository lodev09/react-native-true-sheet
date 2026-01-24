import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  createTrueSheetNavigator,
  useTrueSheetNavigation,
} from '@lodev09/react-native-true-sheet/navigation';
import { Button, DemoContent, Footer } from '@example/shared/components';
import {
  BLUE,
  DARK,
  DARK_BLUE,
  FOOTER_HEIGHT,
  GAP,
  LIGHT_GRAY,
  SPACING,
} from '@example/shared/utils';
import type { AppStackParamList, SheetHomeStackParamList, SheetStackParamList } from '../types';
import {
  NotificationsSheetContent,
  ProfileSheetContent,
  SettingsSheetContent,
  TestScreen,
} from '@example/shared/screens';
import { useAppNavigation } from '../hooks';

const SheetStack = createTrueSheetNavigator<AppStackParamList & SheetStackParamList>();
const SheetHomeStack = createNativeStackNavigator<AppStackParamList & SheetHomeStackParamList>();

const HomeScreen = () => {
  const navigation = useTrueSheetNavigation<AppStackParamList & SheetStackParamList>();

  return (
    <View style={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>Sheet Navigator</Text>
        <Text style={styles.subtitle}>
          Using createTrueSheetNavigator for react-navigation integration.
        </Text>
      </View>
      <Button text="Open Details Sheet" onPress={() => navigation.navigate('Details')} />
      <Button text="Open Settings Sheet" onPress={() => navigation.navigate('Settings')} />
      <Button text="Navigate to Test" onPress={() => navigation.navigate('Test')} />
      <Button text="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

const TestScreenWrapper = () => {
  const navigation = useAppNavigation();
  return <TestScreen onGoBack={() => navigation.goBack()} />;
};

const SheetHomeNavigator = () => {
  return (
    <SheetHomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: DARK_BLUE },
        headerTintColor: 'white',
      }}
      initialRouteName="Home"
    >
      <SheetHomeStack.Screen name="Home" component={HomeScreen} />
      <SheetHomeStack.Screen name="Test" component={TestScreenWrapper} />
    </SheetHomeStack.Navigator>
  );
};

const DetailsSheet = () => {
  const navigation = useTrueSheetNavigation<AppStackParamList & SheetStackParamList>();
  const sheetRef = useRef<TrueSheet>(null);

  useEffect(() => {
    navigation.setOptions({
      footer: <Footer onPress={() => sheetRef.current?.present()} />,
    });
  }, [navigation]);

  return (
    <View style={[styles.sheetContent, { paddingBottom: FOOTER_HEIGHT + SPACING }]}>
      <Text style={styles.sheetTitle}>Details Sheet</Text>
      <Text style={styles.sheetSubtitle}>This is a sheet screen using react-navigation.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="Resize to 100%" onPress={() => navigation.resize(1)} />
        <Button text="Open Settings" onPress={() => navigation.navigate('Settings')} />
        <Button text="Go Back" onPress={() => navigation.goBack()} />
      </View>
      <TrueSheet ref={sheetRef} cornerRadius={12} detents={['auto']} backgroundColor={DARK}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Footer Sheet</Text>
          <Text style={styles.sheetSubtitle}>Presented from footer button!</Text>
        </View>
      </TrueSheet>
    </View>
  );
};

const SettingsSheet = () => {
  const navigation = useTrueSheetNavigation<AppStackParamList & SheetStackParamList>();

  return (
    <SettingsSheetContent
      onResize={() => navigation.resize(1)}
      onOpenProfile={() => navigation.navigate('Profile')}
      onPop={() => navigation.pop()}
    />
  );
};

const ProfileSheet = () => {
  const navigation = useTrueSheetNavigation<AppStackParamList & SheetStackParamList>();

  return (
    <ProfileSheetContent
      onOpenNotifications={() => navigation.navigate('Notifications')}
      onPop={() => navigation.pop()}
      onPop2={() => navigation.pop(2)}
      onPopToTop={() => navigation.popToTop()}
    />
  );
};

const NotificationsSheet = () => {
  const navigation = useTrueSheetNavigation<AppStackParamList & SheetStackParamList>();

  return (
    <NotificationsSheetContent
      onPop={() => navigation.pop()}
      onPop2={() => navigation.pop(2)}
      onPopToSettings={() => navigation.popTo('Settings')}
      onPopToDetails={() => navigation.popTo('Details')}
      onPopToTop={() => navigation.popToTop()}
    />
  );
};

export const SheetNavigator = () => {
  return (
    <SheetStack.Navigator
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
        // sheetPositionChange: (e) => {
        //   console.log(
        //     `[SheetNavigator] sheetPositionChange: position=${e.data.position.toFixed(0)}, realtime=${e.data.realtime}`
        //   );
        // },
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
      {/* Base screen (first screen is the default base) */}
      <SheetStack.Screen name="SheetHomeStack" component={SheetHomeNavigator} />
      {/* Sheet screens */}
      <SheetStack.Screen
        name="Details"
        component={DetailsSheet}
        options={{
          detents: ['auto', 1],
          cornerRadius: 16,
          backgroundColor: DARK,
        }}
      />
      <SheetStack.Screen
        name="Settings"
        component={SettingsSheet}
        options={{
          detents: ['auto', 1],
          backgroundColor: DARK,
          cornerRadius: 16,
          reanimated: true,
          positionChangeHandler: (payload) => {
            'worklet';
            console.log(payload.position);
          },
        }}
      />
      <SheetStack.Screen
        name="Profile"
        component={ProfileSheet}
        options={{
          detents: ['auto', 1],
          backgroundColor: DARK,
          cornerRadius: 16,
        }}
      />
      <SheetStack.Screen
        name="Notifications"
        component={NotificationsSheet}
        options={{
          detents: ['auto', 1],
          backgroundColor: DARK,
          cornerRadius: 16,
        }}
      />
    </SheetStack.Navigator>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    flex: 1,
    padding: SPACING,
    gap: GAP,
  },
  heading: {
    marginBottom: SPACING * 2,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
    color: 'white',
  },
  subtitle: {
    lineHeight: 24,
    color: LIGHT_GRAY,
  },
  sheetContent: {
    padding: SPACING,
    gap: GAP,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: LIGHT_GRAY,
    marginBottom: SPACING,
  },
  buttons: {
    gap: GAP,
    marginTop: SPACING,
  },
});
