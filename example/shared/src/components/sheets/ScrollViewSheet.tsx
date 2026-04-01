import { forwardRef, useCallback, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Text,
  Image,
  ActivityIndicator,
  Platform,
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
import { Footer } from '../Footer';
import { Header } from '../Header';
import { Button } from '../Button';

interface ScrollViewSheetProps extends TrueSheetProps {}

const HeavyItem = ({ index }: { index: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <View style={styles.item}>
      <View style={styles.imageContainer}>
        {!imageLoaded && <ActivityIndicator style={styles.loader} size="small" />}
        <Image
          source={{ uri: `https://picsum.photos/seed/${index}/400/300` }}
          style={styles.image}
          onLoad={() => setImageLoaded(true)}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>Item #{index + 1}</Text>
        <Text style={styles.itemDescription}>
          Complex component with images and text to test heavy rendering and lazy loading.
        </Text>
      </View>
    </View>
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
      scrollable
      scrollableOptions={{
        scrollingExpandsSheet: false,
        bottomScrollEdgeEffect: 'soft',
        topScrollEdgeEffect: 'soft',
      }}
      backgroundColor={Platform.select({ android: DARK })}
      header={<Header />}
      headerStyle={styles.header}
      footer={
        <Footer wrapperStyle={styles.footer}>
          <Button text="Toggle ListView" onPress={() => setShowList(!showList)} />
        </Footer>
      }
      onDidDismiss={() => console.log('Sheet ScrollView dismissed!')}
      onDidPresent={() => console.log(`Sheet ScrollView presented!`)}
      {...props}
    >
      {showList ? (
        <ScrollView
          contentContainerStyle={styles.content}
          indicatorStyle="black"
          scrollIndicatorInsets={{ bottom: FOOTER_HEIGHT }}
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {times(20, (i) => (
            <HeavyItem key={i} index={i} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>List is hidden</Text>
        </View>
      )}
    </TrueSheet>
  );
});

ScrollViewSheet.displayName = 'ScrollViewSheet';

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: HEADER_HEIGHT,
    paddingBottom: FOOTER_HEIGHT + SPACING,
    gap: GAP,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
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
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 14,
  },
});
