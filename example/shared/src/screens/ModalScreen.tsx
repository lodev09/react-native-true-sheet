import { useRef, useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { TrueSheet, TrueSheetProvider } from '@lodev09/react-native-true-sheet';

import { BLUE, DARK, DARK_BLUE, DARK_GRAY, GAP, LIGHT_GRAY, SPACING } from '../utils';
import { Button, DemoContent, Input, Spacer } from '../components';
import { PromptSheet, FlatListSheet } from '../components/sheets';

export interface ModalScreenProps {
  onNavigateToTest?: () => void;
  onDismiss?: () => void;
}

export const ModalScreen = ({ onNavigateToTest, onDismiss }: ModalScreenProps) => {
  const promptSheet = useRef<TrueSheet>(null);
  const flatlistSheet = useRef<TrueSheet>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const modalSimpleSheet = useRef<TrueSheet>(null);
  const modalFlatlistSheet = useRef<TrueSheet>(null);

  useEffect(() => {
    if (modalVisible) {
      modalSimpleSheet.current?.present();
    }
  }, [modalVisible]);

  return (
    <TrueSheetProvider>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>Modal Screen</Text>
          <Text style={styles.subtitle}>
            This is a fullScreenModal opened from a TrueSheet. You can present sheets from here too!
          </Text>
        </View>
        <Input />
        <Button text="Dismiss Modal" onPress={onDismiss} />
        <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
        <Button text="TrueSheet FlatList" onPress={() => flatlistSheet.current?.present()} />
        <Button text="Open RN Modal" onPress={() => setModalVisible(true)} />
        <Spacer />
        <Button text="Navigate Test" onPress={onNavigateToTest} />

        <PromptSheet initialDetentIndex={0} ref={promptSheet} dimmed={false} />
        <FlatListSheet ref={flatlistSheet} />

        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TrueSheetProvider>
            <View style={styles.modalContent}>
              <View style={styles.heading}>
                <Text style={styles.title}>React Native Modal</Text>
                <Text style={styles.subtitle}>
                  This is a React Native Modal. You can present TrueSheets from here!
                </Text>
              </View>
              <Button text="Simple Sheet" onPress={() => modalSimpleSheet.current?.present()} />
              <Button text="FlatList Sheet" onPress={() => modalFlatlistSheet.current?.present()} />
              <Spacer />
              <Button text="Close Modal" onPress={() => setModalVisible(false)} />

              <TrueSheet
                ref={modalSimpleSheet}
                detents={['auto']}
                // initialDetentIndex={0}
                dimmed={false}
                style={styles.simpleSheet}
                backgroundColor={DARK}
              >
                <DemoContent color={DARK_BLUE} text="Simple Sheet" />
                <Button text="Dismiss" onPress={() => modalSimpleSheet.current?.dismiss()} />
              </TrueSheet>
              <FlatListSheet ref={modalFlatlistSheet} />
            </View>
          </TrueSheetProvider>
        </Modal>
      </View>
    </TrueSheetProvider>
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
  modalContent: {
    backgroundColor: DARK_GRAY,
    justifyContent: 'center',
    flex: 1,
    padding: SPACING,
    gap: GAP,
  },
  simpleSheet: {
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
});
