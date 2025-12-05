import { StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';

import {
  createTrueSheetNavigator,
  useTrueSheetNavigation,
} from '@lodev09/react-native-true-sheet/navigation';
import { Button, DemoContent } from '../components';
import { BLUE, DARK, GAP, LIGHT_GRAY, SPACING } from '../utils';

type SheetNavigatorParamList = {
  Home: undefined;
  Details: undefined;
  Settings: undefined;
};

const Sheet = createTrueSheetNavigator<SheetNavigatorParamList>();

const HomeScreen = () => {
  const navigation = useTrueSheetNavigation<SheetNavigatorParamList>();

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCamera={{
          altitude: 18000,
          zoom: 14,
          center: {
            latitude: 9.306743705457553,
            longitude: 123.30474002203727,
          },
          pitch: 0,
          heading: 0,
        }}
        userInterfaceStyle="dark"
      />
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>Sheet Navigator</Text>
          <Text style={styles.subtitle}>
            Using createTrueSheetNavigator for react-navigation integration.
          </Text>
        </View>
        <Button text="Open Details Sheet" onPress={() => navigation.navigate('Details')} />
        <Button text="Open Settings Sheet" onPress={() => navigation.navigate('Settings')} />
      </View>
    </View>
  );
};

const DetailsSheet = () => {
  const navigation = useTrueSheetNavigation<SheetNavigatorParamList>();

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Details Sheet</Text>
      <Text style={styles.sheetSubtitle}>This is a sheet screen using react-navigation.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="Resize to 100%" onPress={() => navigation.resize(1)} />
        <Button text="Open Settings" onPress={() => navigation.navigate('Settings')} />
        <Button text="Go Back" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
};

const SettingsSheet = () => {
  const navigation = useTrueSheetNavigation<SheetNavigatorParamList>();

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Settings Sheet</Text>
      <Text style={styles.sheetSubtitle}>Another sheet in the navigation stack.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="Resize to 100%" onPress={() => navigation.resize(1)} />
        <Button text="Go Back" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
};

export const SheetNavigator = () => {
  return (
    <Sheet.Navigator>
      <Sheet.Screen name="Home" component={HomeScreen} />
      <Sheet.Screen
        name="Details"
        component={DetailsSheet}
        options={{
          detents: ['auto', 1],
          cornerRadius: 16,
        }}
      />
      <Sheet.Screen
        name="Settings"
        component={SettingsSheet}
        options={{
          detents: ['auto', 1],
          backgroundColor: DARK,
          cornerRadius: 16,
        }}
      />
    </Sheet.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: BLUE,
    flex: 1,
  },
  map: {
    flex: 1,
  },
  content: {
    position: 'absolute',
    top: 100,
    left: SPACING,
    right: SPACING,
    gap: GAP,
  },
  heading: {
    marginBottom: SPACING,
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
