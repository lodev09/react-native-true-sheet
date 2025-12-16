import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

// Import the mocks from the new locations
import { TrueSheet, TrueSheetProvider, useTrueSheet } from '../mock';
import {
  ReanimatedTrueSheet,
  ReanimatedTrueSheetProvider,
  useReanimatedTrueSheet,
  useReanimatedPositionChangeHandler,
} from '../reanimated/mock';

describe('TrueSheet Mocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TrueSheet Component Mock', () => {
    it('should have static methods', () => {
      expect(TrueSheet.present).toBeDefined();
      expect(TrueSheet.dismiss).toBeDefined();
      expect(TrueSheet.resize).toBeDefined();
      expect(typeof TrueSheet.present).toBe('function');
      expect(typeof TrueSheet.dismiss).toBe('function');
      expect(typeof TrueSheet.resize).toBe('function');
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
