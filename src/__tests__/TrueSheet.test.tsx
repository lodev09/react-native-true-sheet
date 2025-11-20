import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { TrueSheet } from '../index';

describe('TrueSheet', () => {
  it('should export TrueSheet component', () => {
    expect(TrueSheet).toBeDefined();
    expect(typeof TrueSheet).toBe('function');
  });

  it('should have present static method', () => {
    expect(TrueSheet.present).toBeDefined();
    expect(typeof TrueSheet.present).toBe('function');
  });

  it('should have dismiss static method', () => {
    expect(TrueSheet.dismiss).toBeDefined();
    expect(typeof TrueSheet.dismiss).toBe('function');
  });

  it('should have resize static method', () => {
    expect(TrueSheet.resize).toBeDefined();
    expect(typeof TrueSheet.resize).toBe('function');
  });

  it('should render TrueSheet component without crashing', () => {
    const { getByText } = render(
      <TrueSheet name="test" initialDetentIndex={0}>
        <Text>Test Content</Text>
      </TrueSheet>
    );
    expect(getByText('Test Content')).toBeDefined();
  });

  it('should render with footer prop', () => {
    const { getByText } = render(
      <TrueSheet name="test" initialDetentIndex={0} footer={<Text>Footer Content</Text>}>
        <Text>Content</Text>
      </TrueSheet>
    );
    expect(getByText('Content')).toBeDefined();
    expect(getByText('Footer Content')).toBeDefined();
  });

  it('should render with detents prop', () => {
    const { getByText } = render(
      <TrueSheet name="test" detents={[0.5, 1]} initialDetentIndex={0}>
        <Text>Detent Content</Text>
      </TrueSheet>
    );
    expect(getByText('Detent Content')).toBeDefined();
  });

  it('should render with style prop', () => {
    const { getByText } = render(
      <TrueSheet name="test" initialDetentIndex={0} style={{ padding: 20 }}>
        <Text>Styled Content</Text>
      </TrueSheet>
    );
    expect(getByText('Styled Content')).toBeDefined();
  });
});
