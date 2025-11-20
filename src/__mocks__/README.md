# TrueSheet Mocks

This directory contains Jest mocks for the TrueSheet library, making it easy to test components that use TrueSheet without requiring native modules.

## Usage

### Automatic Mocking (Recommended)

Jest will automatically use these mocks when you add the following to your Jest configuration:

```json
{
  "jest": {
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
  }
}
```

Then in your `jest.setup.js`:

```js
jest.mock('@lodev09/react-native-true-sheet');
```

### Manual Mocking

If you prefer manual mocking per test file:

```js
import { TrueSheet } from '@lodev09/react-native-true-sheet';

jest.mock('@lodev09/react-native-true-sheet');

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should present a sheet', async () => {
    await TrueSheet.present('my-sheet', 0);
    
    expect(TrueSheet.present).toHaveBeenCalledWith('my-sheet', 0);
  });
});
```

## What's Mocked

### TrueSheet Component
- Renders as a `View` component with all props passed through
- Static methods: `present()`, `dismiss()`, `resize()`
- Instance methods: `present()`, `dismiss()`, `resize()`
- All methods are Jest mock functions that return resolved Promises

### ReanimatedTrueSheet Component
- Same as TrueSheet but for reanimated-enabled sheets

### TrueSheetGrabber
- Renders as a `View` with `testID="true-sheet-grabber"`

### ReanimatedTrueSheetProvider
- Renders children without modification

### Hooks
- `useReanimatedTrueSheet()`: Returns mock ref and position
- `useReanimatedPositionChangeHandler()`: Returns a mock function

## Example Test

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import MyComponent from './MyComponent';

jest.mock('@lodev09/react-native-true-sheet');

describe('MyComponent', () => {
  it('should open sheet when button is pressed', async () => {
    const { getByText } = render(<MyComponent />);
    
    const button = getByText('Open Sheet');
    fireEvent.press(button);
    
    expect(TrueSheet.present).toHaveBeenCalledWith('my-sheet', 0);
  });

  it('should render sheet with content', () => {
    const { getByText } = render(
      <TrueSheet name="test">
        <Text>Sheet Content</Text>
      </TrueSheet>
    );
    
    expect(getByText('Sheet Content')).toBeDefined();
  });
});
```

## Notes

- All static methods are Jest mock functions, so you can use `.toHaveBeenCalled()`, `.toHaveBeenCalledWith()`, etc.
- Remember to call `jest.clearAllMocks()` in your `beforeEach()` to reset mock state between tests
- The mocks are suitable for both JavaScript and TypeScript projects