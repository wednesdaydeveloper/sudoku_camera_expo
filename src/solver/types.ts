export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Board = Cell[][];

export type SolveResult =
  | { status: 'solved'; board: Board; durationMs: number }
  | { status: 'invalid'; reason: string }
  | { status: 'unsolvable'; durationMs: number };

export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;
