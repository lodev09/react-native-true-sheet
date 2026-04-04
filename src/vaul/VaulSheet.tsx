import type { WebRenderer } from '../web/types';

// Vaul renderer is web-only. On native, this is a no-op stub.
export const VaulRenderer = undefined as unknown as WebRenderer;
