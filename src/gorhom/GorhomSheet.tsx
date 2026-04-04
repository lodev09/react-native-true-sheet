import type { WebRenderer } from '../web/types';

// Gorhom renderer is web-only. On native, this is a no-op stub.
export const GorhomRenderer = undefined as unknown as WebRenderer;
