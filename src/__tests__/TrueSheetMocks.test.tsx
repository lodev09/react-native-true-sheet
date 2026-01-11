import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

// Import the mocks
import { TrueSheet, TrueSheetProvider, useTrueSheet } from '../mocks';
import {
  createTrueSheetNavigator,
  TrueSheetActions,
  useTrueSheetNavigation,
} from '../mocks/navigation';
import {
  ReanimatedTrueSheet,
  ReanimatedTrueSheetProvider,
  useReanimatedTrueSheet,
  useReanimatedPositionChangeHandler,
} from '../mocks/reanimated';

describe('TrueSheet Mocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TrueSheet Component Mock', () => {
    it('should have static methods', () => {
      expect(TrueSheet.present).toBeDefined();
      expect(TrueSheet.dismiss).toBeDefined();
      expect(TrueSheet.resize).toBeDefined();
      expect(TrueSheet.dismissAll).toBeDefined();
      expect(typeof TrueSheet.present).toBe('function');
      expect(typeof TrueSheet.dismiss).toBe('function');
      expect(typeof TrueSheet.resize).toBe('function');
      expect(typeof TrueSheet.dismissAll).toBe('function');
    });

    it('should render children', () => {
      const { getByText } = render(
        <TrueSheet name="test" initialDetentIndex={0}>
          <Text>Mock Content</Text>
        </TrueSheet>
      );
      expect(getByText('Mock Content')).toBeDefined();
    });

    it('should render with footer', () => {
      const { getByText } = render(
        <TrueSheet name="test" initialDetentIndex={0} footer={<Text>Footer</Text>}>
          <Text>Content</Text>
        </TrueSheet>
      );
      expect(getByText('Content')).toBeDefined();
      expect(getByText('Footer')).toBeDefined();
    });

    it('should call static present method', async () => {
      await TrueSheet.present('test-sheet', 0);
      expect(TrueSheet.present).toHaveBeenCalledWith('test-sheet', 0);
    });

    it('should call static dismiss method', async () => {
      await TrueSheet.dismiss('test-sheet');
      expect(TrueSheet.dismiss).toHaveBeenCalledWith('test-sheet');
    });

    it('should call static resize method', async () => {
      await TrueSheet.resize('test-sheet', 1);
      expect(TrueSheet.resize).toHaveBeenCalledWith('test-sheet', 1);
    });

    it('should call static dismissAll method', async () => {
      await TrueSheet.dismissAll();
      expect(TrueSheet.dismissAll).toHaveBeenCalled();
    });

    it('should track instances by name', () => {
      const { rerender } = render(
        <TrueSheet name="tracked-sheet" initialDetentIndex={0}>
          <Text>Content</Text>
        </TrueSheet>
      );

      expect(TrueSheet.instances['tracked-sheet']).toBeDefined();

      // Unmount to test cleanup
      rerender(<Text>Empty</Text>);
    });
  });

  describe('TrueSheetProvider Mock', () => {
    it('should render children without modification', () => {
      const { getByText } = render(
        <TrueSheetProvider>
          <Text>Provider Content</Text>
        </TrueSheetProvider>
      );
      expect(getByText('Provider Content')).toBeDefined();
    });
  });

  describe('useTrueSheet Hook Mock', () => {
    it('should return mock methods', () => {
      const result = useTrueSheet();
      expect(result.present).toBeDefined();
      expect(result.dismiss).toBeDefined();
      expect(result.resize).toBeDefined();
      expect(result.dismissAll).toBeDefined();
    });
  });

  describe('createTrueSheetNavigator Mock', () => {
    it('should return navigator components', () => {
      const Navigator = createTrueSheetNavigator();
      expect(Navigator.Navigator).toBeDefined();
      expect(Navigator.Screen).toBeDefined();
      expect(Navigator.Group).toBeDefined();
    });

    it('should be a jest mock function', () => {
      jest.clearAllMocks();
      createTrueSheetNavigator();
      expect(createTrueSheetNavigator).toHaveBeenCalledTimes(1);
    });
  });

  describe('TrueSheetActions Mock', () => {
    it('should have all action creators', () => {
      expect(TrueSheetActions.push).toBeDefined();
      expect(TrueSheetActions.pop).toBeDefined();
      expect(TrueSheetActions.popTo).toBeDefined();
      expect(TrueSheetActions.popToTop).toBeDefined();
      expect(TrueSheetActions.replace).toBeDefined();
      expect(TrueSheetActions.resize).toBeDefined();
      expect(TrueSheetActions.dismiss).toBeDefined();
      expect(TrueSheetActions.remove).toBeDefined();
    });

    it('should return action objects', () => {
      expect(TrueSheetActions.push('TestScreen')).toEqual({
        type: 'PUSH',
        payload: { name: 'TestScreen', params: undefined },
      });
      expect(TrueSheetActions.resize(1)).toEqual({ type: 'RESIZE', index: 1 });
      expect(TrueSheetActions.dismiss()).toEqual({ type: 'DISMISS' });
    });
  });

  describe('useTrueSheetNavigation Hook Mock', () => {
    it('should return navigation object with all methods', () => {
      const navigation = useTrueSheetNavigation();
      expect(navigation.navigate).toBeDefined();
      expect(navigation.goBack).toBeDefined();
      expect(navigation.push).toBeDefined();
      expect(navigation.pop).toBeDefined();
      expect(navigation.resize).toBeDefined();
      expect(navigation.dispatch).toBeDefined();
    });

    it('should be a jest mock function', () => {
      jest.clearAllMocks();
      useTrueSheetNavigation();
      expect(useTrueSheetNavigation).toHaveBeenCalledTimes(1);
    });
  });

  describe('ReanimatedTrueSheet Component Mock', () => {
    it('should render children', () => {
      const { getByText } = render(
        <ReanimatedTrueSheet name="test" initialDetentIndex={0}>
          <Text>Reanimated Content</Text>
        </ReanimatedTrueSheet>
      );
      expect(getByText('Reanimated Content')).toBeDefined();
    });
  });

  describe('ReanimatedTrueSheetProvider Mock', () => {
    it('should render children without modification', () => {
      const { getByText } = render(
        <ReanimatedTrueSheetProvider>
          <Text>Provider Content</Text>
        </ReanimatedTrueSheetProvider>
      );
      expect(getByText('Provider Content')).toBeDefined();
    });
  });

  describe('useReanimatedTrueSheet Hook Mock', () => {
    it('should return mock shared values', () => {
      const result = useReanimatedTrueSheet();
      expect(result.animatedPosition).toBeDefined();
      expect(result.animatedIndex).toBeDefined();
      expect(result.animatedDetent).toBeDefined();
      expect(result.animatedPosition.value).toBe(0);
      expect(result.animatedIndex.value).toBe(-1);
      expect(result.animatedDetent.value).toBe(0);
    });

    it('should be a jest mock function', () => {
      jest.clearAllMocks();
      useReanimatedTrueSheet();
      expect(useReanimatedTrueSheet).toHaveBeenCalledTimes(1);
    });
  });

  describe('useReanimatedPositionChangeHandler Hook Mock', () => {
    it('should return a mock function', () => {
      const callback = jest.fn();
      const handler = useReanimatedPositionChangeHandler(callback);
      expect(typeof handler).toBe('function');
    });

    it('should be a jest mock function', () => {
      jest.clearAllMocks();
      const callback = jest.fn();
      useReanimatedPositionChangeHandler(callback);
      expect(useReanimatedPositionChangeHandler).toHaveBeenCalledTimes(1);
      expect(useReanimatedPositionChangeHandler).toHaveBeenCalledWith(callback);
    });
  });
});
