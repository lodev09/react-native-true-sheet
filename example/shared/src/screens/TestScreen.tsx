import { useRef, useState } from 'react';
import {
  Platform,
  PlatformColor,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ColorValue,
} from 'react-native';
import { TrueSheet, TrueSheetProvider } from '@lodev09/react-native-true-sheet';

import { BLUE, DARK, GAP, LIGHT_GRAY, SPACING } from '../utils';
import { Button, Header, Spacer } from '../components';
import { BasicSheet, PromptSheet, FlatListSheet } from '../components/sheets';

interface TestScreenProps {
  onGoBack: () => void;
}

export const TestScreen = ({ onGoBack }: TestScreenProps) => {
  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);
  const backgroundSheet = useRef<TrueSheet>(null);
  const grabberSheet = useRef<TrueSheet>(null);
  const [grabberColor, setGrabberColor] = useState<ColorValue>();

  return (
    <TrueSheetProvider>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.heading}>
          <Text style={styles.subtitle}>Sheets on a native stack screen</Text>
          <Text style={styles.copy}>
            Scroll to collapse the large title. The sheets stay mounted and keep working.
          </Text>
        </View>
        <Button text="Go Back" onPress={onGoBack} />
        <Spacer />
        <Button text="Basic Sheet" onPress={() => basicSheet.current?.present()} />
        <Button text="Prompt Sheet" onPress={() => promptSheet.current?.present()} />
        <Button text="FlatList Sheet" onPress={() => flatListSheet.current?.present()} />
        <Button text="Custom Background" onPress={() => backgroundSheet.current?.present()} />
        <Button text="Grabber Colors" onPress={() => grabberSheet.current?.present()} />
      </ScrollView>

      <BasicSheet dismissible={false} initialDetentIndex={0} dimmed={false} ref={basicSheet} />
      <PromptSheet ref={promptSheet} />
      <FlatListSheet ref={flatListSheet} />
      <TrueSheet
        ref={grabberSheet}
        detents={['auto']}
        grabberOptions={{ color: grabberColor, adaptive: false }}
        style={styles.sheetContent}
      >
        <Text>Change the grabber color while the sheet is open.</Text>
        <Button
          text="Platform color"
          onPress={() =>
            setGrabberColor(
              Platform.select<ColorValue>({
                android: PlatformColor('?android:attr/textColorSecondary'),
                ios: PlatformColor('secondaryLabel'),
                default: '#FF0000',
              })
            )
          }
        />
        <Button text="Static red" onPress={() => setGrabberColor('#FF0000')} />
        <Button text="Default color" onPress={() => setGrabberColor(undefined)} />
        <Button text="Close" onPress={() => grabberSheet.current?.dismiss()} />
      </TrueSheet>
      <TrueSheet
        ref={backgroundSheet}
        detents={['auto', 1]}
        backgroundStyle={{ backgroundColor: DARK }}
        background={
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.backgroundStripe} />
          </View>
        }
        header={<Header />}
        style={styles.sheetContent}
      >
        <Button text="Full" onPress={() => backgroundSheet.current?.resize(1)} />
        <Button text="Auto" onPress={() => backgroundSheet.current?.resize(0)} />
        <Button text="Close" onPress={() => backgroundSheet.current?.dismiss()} />
      </TrueSheet>
    </TrueSheetProvider>
  );
};

const styles = StyleSheet.create({
  backgroundStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '50%',
    backgroundColor: BLUE,
  },
  sheetContent: {
    padding: SPACING,
    gap: GAP,
  },
  container: {
    backgroundColor: BLUE,
  },
  content: {
    padding: SPACING,
    gap: GAP,
  },
  heading: {
    gap: GAP / 2,
    marginBottom: SPACING,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '500',
    color: 'white',
  },
  copy: {
    lineHeight: 24,
    color: LIGHT_GRAY,
  },
});
