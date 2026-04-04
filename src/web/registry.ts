import type { WebRenderer } from './types';

let activeRenderer: WebRenderer | null = null;

export function setWebRenderer(renderer: WebRenderer) {
  activeRenderer = renderer;
}

export function getWebRenderer(): WebRenderer {
  if (!activeRenderer) {
    throw new Error(
      'TrueSheet: No web renderer set. Call TrueSheet.setWebRenderer() with a renderer before using TrueSheet on web.\n\n' +
        'Example:\n' +
        '  import { GorhomRenderer } from "@lodev09/react-native-true-sheet/gorhom"\n' +
        '  TrueSheet.setWebRenderer(GorhomRenderer)\n\n' +
        'Available renderers: @lodev09/react-native-true-sheet/gorhom, @lodev09/react-native-true-sheet/vaul'
    );
  }
  return activeRenderer;
}
