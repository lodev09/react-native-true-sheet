import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TrueSheetOverlay } from '../TrueSheetOverlay.web';

jest.mock('react-dom', () => ({ createPortal: (children: React.ReactNode) => children }), {
  virtual: true,
});

let phase = 'idle';

const Before = () => {
  phase = 'render';
  return null;
};

const After = () => {
  phase = 'commit';
  return null;
};

describe('TrueSheetOverlay (web)', () => {
  const container = { style: {}, remove: jest.fn() };
  const createElement = jest.fn(() => container);
  const appendChild = jest.fn();
  const phases: string[] = [];

  beforeEach(() => {
    createElement.mockImplementation(() => {
      phases.push(phase);
      return container;
    });
    global.document = { createElement, body: { appendChild } } as unknown as Document;
  });

  it('creates its portal once mounted, as a server-rendered page has none', () => {
    const { getByText, unmount } = render(
      <>
        <Before />
        <TrueSheetOverlay>
          <Text>Toast</Text>
        </TrueSheetOverlay>
        <After />
      </>
    );

    expect(phases).toEqual(['commit']);
    expect(appendChild).toHaveBeenCalledWith(container);
    expect(getByText('Toast')).toBeTruthy();

    unmount();
    expect(container.remove).toHaveBeenCalled();
  });
});
