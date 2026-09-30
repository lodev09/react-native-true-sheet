import { Platform } from 'react-native';

import { DARK_BLUE } from './constants';

// iOS large titles need a transparent header; an opaque one covers the title
// when UIKit hosts it in the scroll view. Android has no large titles.
export const LARGE_TITLE_HEADER_OPTIONS = {
  headerStyle: Platform.select({ android: { backgroundColor: DARK_BLUE } }),
  headerLargeTitleEnabled: true,
  headerLargeTitleStyle: { color: 'white' },
};
