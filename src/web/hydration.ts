import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False on the server and while hydrating a server-rendered page, true once hydrated (and in
 * client-only apps), when the window can be read without the render differing from the server's.
 */
export const useIsHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
