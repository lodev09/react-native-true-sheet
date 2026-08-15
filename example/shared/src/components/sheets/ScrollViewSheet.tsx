import { forwardRef, useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Text,
  Image,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import {
  BORDER_RADIUS,
  DARK,
  DARK_GRAY,
  FOOTER_HEIGHT,
  GAP,
  HEADER_HEIGHT,
  LIGHT_GRAY,
  SPACING,
  times,
} from '../../utils';
import { Footer, FooterPill } from '../Footer';
import { Header } from '../Header';
import { Text as ThemedText } from '../Text';

interface ScrollViewSheetProps extends TrueSheetProps {}

const HeavyItem = ({ index }: { index: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const sheet = useRef<TrueSheet>(null);

  return (
    <Pressable style={styles.item} onPress={() => console.log(`HeavyItem #${index + 1} pressed!`)}>
      <View style={styles.imageContainer}>
        {!imageLoaded && <ActivityIndicator style={styles.loader} size="small" />}
        <Image
          source={{ uri: `https://picsum.photos/seed/${index}/400/300` }}
          style={styles.image}
          onLoad={() => setImageLoaded(true)}
        />
      </View>
      <Pressable style={styles.itemContent} onPress={() => sheet.current?.present()}>
        <Text style={styles.itemTitle}>Item #{index + 1}</Text>
        <Text style={styles.itemDescription}>
          Complex component with images and text to test heavy rendering and lazy loading.
        </Text>
      </Pressable>
      <TrueSheet ref={sheet} detents={[0.5]} backgroundColor={Platform.select({ android: DARK })}>
        <View style={styles.placeholder}>
          <ThemedText style={styles.placeholderText}>Sheet content</ThemedText>
        </View>
      </TrueSheet>
    </Pressable>
  );
};

export const ScrollViewSheet = forwardRef<TrueSheet, ScrollViewSheetProps>((props, ref) => {
  const [showList, setShowList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <TrueSheet
      ref={ref}
      detents={[0.8, 1]}
      name="scrollview"
      style={styles.sheet}
      scrollableOptions={{
        scrollingExpandsSheet: false,
        bottomScrollEdgeEffect: 'soft',
        topScrollEdgeEffect: 'soft',
      }}
      backgroundColor={Platform.select({ android: DARK })}
      header={<Header />}
      headerOptions={{ position: 'absolute' }}
      footer={
        // The footer background is transparent on iOS, so it follows the theme
        <Footer themed={Platform.OS === 'ios'}>
          <FooterPill text="Toggle ListView" onPress={() => setShowList(!showList)} />
        </Footer>
      }
      footerStyle={styles.footer}
      footerOptions={{ position: 'absolute' }}
      onDidDismiss={() => console.log('Sheet ScrollView dismissed!')}
      onDidPresent={() => console.log(`Sheet ScrollView presented!`)}
      {...props}
    >
      {showList ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {times(20, (i) => (
            <HeavyItem key={i} index={i} />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.placeholder, styles.listPlaceholder]}>
          <ThemedText style={styles.placeholderText}>List is hidden</ThemedText>
        </View>
      )}
    </TrueSheet>
  );
});

ScrollViewSheet.displayName = 'ScrollViewSheet';

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  content: {
    padding: SPACING,
    paddingTop: HEADER_HEIGHT + SPACING,
    paddingBottom: FOOTER_HEIGHT + SPACING,
    gap: GAP,
  },
  footer: {
    backgroundColor: Platform.select({
      default: DARK_GRAY,
      ios: undefined,
    }),
  },
  item: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: SPACING * 10,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -10,
  },
  itemContent: {
    padding: SPACING,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: SPACING / 2,
  },
  itemDescription: {
    fontSize: 14,
    color: LIGHT_GRAY,
    lineHeight: 20,
  },
  placeholder: {
    padding: SPACING,
    alignItems: 'center',
  },
  // Clear the absolute header so the message sits in the visible area
  listPlaceholder: {
    paddingTop: HEADER_HEIGHT + SPACING * 2,
  },
  placeholderText: {
    fontSize: 14,
    opacity: 0.5,
    // The sheet background is fixed DARK on Android; themed elsewhere
    ...Platform.select({ android: { color: LIGHT_GRAY } }),
  },
});
