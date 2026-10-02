import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BLUE, GAP, LIGHT_GRAY, SPACING } from '@example/shared/utils';

// Mounts late, like a screen waiting on data, so a sheet's initial present
// lands while a deep-linked modal or sheet is still animating in.
const MOUNT_DELAY = 300;

export const useDelayedMount = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), MOUNT_DELAY);
    return () => clearTimeout(timeout);
  }, []);

  return mounted;
};

// A deep-linked route opened over this screen on a cold start would otherwise
// get the sheet stacked on top of it — hold initialDetentIndex until focused.
export const useFocusedInitialDetentIndex = () => {
  const [initialDetentIndex, setInitialDetentIndex] = useState(-1);

  useFocusEffect(useCallback(() => setInitialDetentIndex(0), []));

  return initialDetentIndex;
};

interface ReproScreenProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export const ReproScreen = ({ title, description, children }: ReproScreenProps) => (
  <View style={styles.content}>
    <View style={styles.heading}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{description}</Text>
    </View>
    {children}
  </View>
);

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
});
