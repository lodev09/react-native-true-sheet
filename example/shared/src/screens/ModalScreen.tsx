import { useRef, useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { TrueSheet, TrueSheetProvider } from '@lodev09/react-native-true-sheet';

import { BLUE, DARK_GRAY, GAP, LIGHT_GRAY, SPACING } from '../utils';
import { Button, Input, Spacer } from '../components';
import {
  PromptSheet,
  FlatListSheet,
  ScrollViewSheet,
  BasicSheet,
  BlankSheet,
} from '../components/sheets';

export interface ModalScreenProps {
  onNavigateToTest?: () => void;
  onDismiss?: () => void;
}

export const ModalScreen = ({ onNavigateToTest, onDismiss }: ModalScreenProps) => {
  const promptSheet = useRef<TrueSheet>(null);
  const flatlistSheet = useRef<TrueSheet>(null);

  const basicSheet = useRef<TrueSheet>(null);
  const blankSheet = useRef<TrueSheet>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const modalBasicSheet = useRef<TrueSheet>(null);
  const modalPromptSheet = useRef<TrueSheet>(null);
  const modalFlatlistSheet = useRef<TrueSheet>(null);
  const modalScrollViewSheet = useRef<TrueSheet>(null);

  useEffect(() => {
    if (modalVisible) {
      modalPromptSheet.current?.present();
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
        <Button text="Navigate Test" onPress={onNavigateToTest} />
        <Button text="Dismiss Modal" onPress={onDismiss} />
        <Spacer />
        <Button text="TrueSheet Basic" onPress={() => basicSheet.current?.present()} />
        <Button text="Blank Sheet" onPress={() => blankSheet.current?.present()} />
        <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
        <Button text="TrueSheet FlatList" onPress={() => flatlistSheet.current?.present()} />
        <Spacer />
        <Button text="Open RN Modal" onPress={() => setModalVisible(true)} />

        <BasicSheet dimmedDetentIndex={1} ref={basicSheet} />
        <BlankSheet dimmed={false} ref={blankSheet} />
        <PromptSheet dimmed={false} ref={promptSheet} />
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
              <Button text="Close Modal" onPress={() => setModalVisible(false)} />
              <Button text="Basic Sheet" onPress={() => modalBasicSheet.current?.present()} />
              <Button text="Prompt Sheet" onPress={() => modalPromptSheet.current?.present()} />
              <Button
                text="ScrollView Sheet"
                onPress={() => modalScrollViewSheet.current?.present()}
              />
              <Button text="FlatList Sheet" onPress={() => modalFlatlistSheet.current?.present()} />
              <Spacer />

              <BasicSheet ref={modalBasicSheet} />
              <PromptSheet dimmed={false} ref={modalPromptSheet} />
              <FlatListSheet ref={modalFlatlistSheet} />
              <ScrollViewSheet ref={modalScrollViewSheet} />
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
