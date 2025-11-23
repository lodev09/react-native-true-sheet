import { StyleSheet, Text, View } from 'react-native';

import { BLUE, LIGHT_GRAY, SPACING } from '../utils';
import { Button } from '../components';
import { useAppNavigation } from '../hooks';

export const ModalScreen = () => {
  const navigation = useAppNavigation();

  return (
    <View style={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>Modal Screen</Text>
        <Text style={styles.subtitle}>
          This is a React Navigation modal screen opened from a TrueSheet.
        </Text>
      </View>

      <Button text="Close Modal" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    flex: 1,
    padding: SPACING,
    gap: SPACING,
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
