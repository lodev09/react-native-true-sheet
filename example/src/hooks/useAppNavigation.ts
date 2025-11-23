import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import type { AppStackParamList } from '../types';

export const useAppNavigation = <T extends keyof AppStackParamList>() =>
  useNavigation<NativeStackNavigationProp<AppStackParamList, T>>();
