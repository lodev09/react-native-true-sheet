import { Text } from 'react-native';
import { useHandler } from 'react-native-reanimated';
import { render } from '@testing-library/react-native';
import { ReanimatedTrueSheet, ReanimatedTrueSheetProvider } from '../reanimated';
import { ReanimatedTrueSheetScreen } from '../navigation/screen/ReanimatedTrueSheetScreen';

describe('Reanimated position change handler', () => {
  beforeEach(() => {
    jest.mocked(useHandler).mockClear();
  });

  it('passes no dependencies to useHandler from ReanimatedTrueSheet', () => {
    render(
      <ReanimatedTrueSheetProvider>
        <ReanimatedTrueSheet detents={[0.5]}>
          <Text>Content</Text>
        </ReanimatedTrueSheet>
      </ReanimatedTrueSheetProvider>
    );

    expect(useHandler).toHaveBeenCalled();
    jest.mocked(useHandler).mock.calls.forEach(([, dependencies]) => {
      expect(dependencies).toBeUndefined();
    });
  });

  it('passes no dependencies to useHandler from ReanimatedTrueSheetScreen', () => {
    render(
      <ReanimatedTrueSheetScreen
        detentIndex={0}
        detents={[0.5]}
        dispatch={jest.fn()}
        emit={jest.fn()}
        routeKey="sheet"
      >
        <Text>Content</Text>
      </ReanimatedTrueSheetScreen>
    );

    expect(useHandler).toHaveBeenCalled();
    jest.mocked(useHandler).mock.calls.forEach(([, dependencies]) => {
      expect(dependencies).toBeUndefined();
    });
  });
});
