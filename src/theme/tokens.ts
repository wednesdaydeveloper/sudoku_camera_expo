// docs/UI-DESIGN.md のデザイントークンを実装。Phase 3 では一部のみ使用。

export const color = {
  bg: '#FFFFFF',
  surface: '#F7F7F8',
  text: '#111111',
  textMuted: '#6B6B6B',
  primary: '#2C7BE5',
  primaryPressed: '#1F5FB8',
  danger: '#D7263D',
  border: '#E5E5E7',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  md: 12,
  lg: 20,
} as const;

export const tap = {
  minSize: 44,
  buttonHeight: 56,
} as const;

export const fontSize = {
  title: 24,
  heading: 22,
  body: 16,
  button: 16,
  caption: 13,
} as const;
