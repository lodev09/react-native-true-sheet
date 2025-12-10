import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { TrueSheet, type DetentChangeEvent } from '@lodev09/react-native-true-sheet';

export default function TabOneScreen() {
  const sheetRef = useRef<TrueSheet>(null);
  const childSheetRef = useRef<TrueSheet>(null);
  const [currentDetent, setCurrentDetent] = useState<number>(-1);

  const handlePresent = (index: number = 0) => {
    sheetRef.current?.present(index);
  };

  const handleResize = (index: number) => {
    sheetRef.current?.resize(index);
  };

  const handleDismiss = () => {
    sheetRef.current?.dismiss();
  };

  const handlePresentChild = () => {
    childSheetRef.current?.present();
  };

  const handleDismissChild = () => {
    childSheetRef.current?.dismiss();
  };

  const handleDetentChange = (event: DetentChangeEvent) => {
    setCurrentDetent(event.nativeEvent.index);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TrueSheet Demo</Text>
      <Text style={styles.subtitle}>Current Detent: {currentDetent}</Text>

      <View style={styles.buttonGroup}>
        <Button title="Present (auto)" onPress={() => handlePresent(0)} />
        <Button title="Present (50%)" onPress={() => handlePresent(1)} />
        <Button title="Present (100%)" onPress={() => handlePresent(2)} />
      </View>

      <TrueSheet
        ref={sheetRef}
        detents={['auto', 0.5, 1]}
        cornerRadius={16}
        grabber
        onDetentChange={handleDetentChange}
        onDidDismiss={() => setCurrentDetent(-1)}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Parent Sheet</Text>
          <Text style={styles.sheetText}>This is a native bottom sheet.</Text>
          <Text style={styles.detentInfo}>Detent Index: {currentDetent}</Text>

          <View style={styles.sheetButtons}>
            <Text style={styles.sectionTitle}>Resize</Text>
            <View style={styles.buttonRow}>
              <Button title="Auto" onPress={() => handleResize(0)} />
              <Button title="50%" onPress={() => handleResize(1)} />
              <Button title="100%" onPress={() => handleResize(2)} />
            </View>
          </View>

          <View style={styles.sheetButtons}>
            <Text style={styles.sectionTitle}>Stacking</Text>
            <Button title="Open Child Sheet" onPress={handlePresentChild} color="#34c759" />
          </View>

          <View style={styles.sheetButtons}>
            <Button title="Dismiss" onPress={handleDismiss} color="#ff3b30" />
          </View>
        </View>

        <TrueSheet
          ref={childSheetRef}
          detents={['auto', 0.7]}
          cornerRadius={16}
          grabber
          backgroundColor="#f0f0f5"
        >
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Child Sheet</Text>
            <Text style={styles.sheetText}>This sheet is stacked on top of the parent.</Text>
            <Text style={styles.sheetText}>Try dragging to resize!</Text>

            <View style={styles.sheetButtons}>
              <Button title="Dismiss Child" onPress={handleDismissChild} color="#ff3b30" />
            </View>
          </View>
        </TrueSheet>
      </TrueSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  buttonGroup: {
    gap: 12,
  },
  sheetContent: {
    padding: 24,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sheetText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  detentInfo: {
    fontSize: 14,
    color: '#007aff',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  sheetButtons: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
