import type { ThemeRegistration } from 'shiki';
import { bundledThemes } from 'shiki/themes';

export type CodeThemes = Record<'light' | 'dark', ThemeRegistration> & Record<string, ThemeRegistration>;

let cached: Promise<CodeThemes> | undefined;

export function loadCodeThemes(): Promise<CodeThemes> {
  cached ??= bundledThemes['one-dark-pro']().then(({ default: base }) => {
    const withBackground = (name: string, background: string): ThemeRegistration => ({
      ...base,
      name,
      colors: { ...base.colors, 'editor.background': background },
    });

    return {
      light: withBackground('true-sheet-light', '#0f1b2d'),
      dark: withBackground('true-sheet-dark', '#1a2d4a'),
    };
  });

  return cached;
}
