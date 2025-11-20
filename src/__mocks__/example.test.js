/**
 * Example test file demonstrating how to use TrueSheet mocks
 * This file is NOT run by Jest - it's just for documentation purposes
 */

import React from 'react';
import { Text, Button } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

// Mock the entire module
jest.mock('@lodev09/react-native-true-sheet');

// Example component that uses TrueSheet
const MyComponent = () => {
  const handlePress = () => {
    TrueSheet.present('my-sheet', 0);
  };

  return (
    <>
      <Button title="Open Sheet" onPress={handlePress} />
      <TrueSheet name="my-sheet" initialDetentIndex={0}>
        <Text>Sheet Content</Text>
      </TrueSheet>
    </>
  );
};

describe('TrueSheet Mock Examples', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();
  });

  it('should call present when button is pressed', async () => {
    const { getByText } = render(<MyComponent />);
    
    const button = getByText('Open Sheet');
    fireEvent.press(button);
    
    // Verify the static present method was called
    expect(TrueSheet.present).toHaveBeenCalledTimes(1);
    expect(TrueSheet.present).toHaveBeenCalledWith('my-sheet', 0);
  });

  it('should render TrueSheet component with children', () => {
    const { getByText } = render(
      <TrueSheet name="test-sheet" initialDetentIndex={0}>
        <Text>My Sheet Content</Text>
      </TrueSheet>
    );
    
    // The mock renders children inside a View
    expect(getByText('My Sheet Content')).toBeDefined();
  });

  it('should render TrueSheet with footer', () => {
    const { getByText } = render(
      <TrueSheet 
        name="test-sheet" 
        initialDetentIndex={0}
        footer={<Text>Footer Content</Text>}
      >
        <Text>Main Content</Text>
      </TrueSheet>
    );
    
    expect(getByText('Main Content')).toBeDefined();
    expect(getByText('Footer Content')).toBeDefined();
  });

  it('should test dismiss functionality', async () => {
    await TrueSheet.dismiss('my-sheet');
    
    expect(TrueSheet.dismiss).toHaveBeenCalledTimes(1);
    expect(TrueSheet.dismiss).toHaveBeenCalledWith('my-sheet');
  });

  it('should test resize functionality', async () => {
    await TrueSheet.resize('my-sheet', 1);
    
    expect(TrueSheet.resize).toHaveBeenCalledTimes(1);
    expect(TrueSheet.resize).toHaveBeenCalledWith('my-sheet', 1);
  });

  it('should allow custom mock implementations', async () => {
    // Override the mock implementation for this specific test
    TrueSheet.present.mockImplementationOnce((name, index) => {
      console.log(`Opening sheet: ${name} at index: ${index}`);
      return Promise.resolve();
    });

    await TrueSheet.present('custom-sheet', 2);
    
    expect(TrueSheet.present).toHaveBeenCalledWith('custom-sheet', 2);
  });

  it('should test instance methods', () => {
    const ref = React.createRef();
    
    render(
      <TrueSheet ref={ref} name="test" initialDetentIndex={0}>
        <Text>Content</Text>
      </TrueSheet>
    );
    
    // Note: In the mock, instance methods are also jest.fn()
    // In a real app, you'd call: ref.current?.present(1);
    // But since it's mocked, you can test the call was made
  });
});