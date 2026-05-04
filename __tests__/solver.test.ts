import { solve } from '../src/solver/solve';
import type { Board, Cell } from '../src/solver/types';

const easyPuzzle: Board = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const mediumPuzzle: Board = [
  [0, 0, 0, 2, 6, 0, 7, 0, 1],
  [6, 8, 0, 0, 7, 0, 0, 9, 0],
  [1, 9, 0, 0, 0, 4, 5, 0, 0],
  [8, 2, 0, 1, 0, 0, 0, 4, 0],
  [0, 0, 4, 6, 0, 2, 9, 0, 0],
  [0, 5, 0, 0, 0, 3, 0, 2, 8],
  [0, 0, 9, 3, 0, 0, 0, 7, 4],
  [0, 4, 0, 0, 5, 0, 0, 3, 6],
  [7, 0, 3, 0, 1, 8, 0, 0, 0],
];

// AI Escargot 系の難問（Arto Inkala 由来）
const hardPuzzle: Board = [
  [1, 0, 0, 0, 0, 7, 0, 9, 0],
  [0, 3, 0, 0, 2, 0, 0, 0, 8],
  [0, 0, 9, 6, 0, 0, 5, 0, 0],
  [0, 0, 5, 3, 0, 0, 9, 0, 0],
  [0, 1, 0, 0, 8, 0, 0, 0, 2],
  [6, 0, 0, 0, 0, 4, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 4, 0, 0, 0, 0, 0, 0, 7],
  [0, 0, 7, 0, 0, 0, 3, 0, 0],
];

const completeBoard: Board = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const emptyBoard: Board = Array.from({ length: 9 }, () =>
  Array<Cell>(9).fill(0)
);

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function isCompleteSolution(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    const rowSet = new Set<number>();
    const colSet = new Set<number>();
    for (let c = 0; c < 9; c++) {
      rowSet.add(board[r][c]);
      colSet.add(board[c][r]);
    }
    if (rowSet.size !== 9 || rowSet.has(0)) return false;
    if (colSet.size !== 9 || colSet.has(0)) return false;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const set = new Set<number>();
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          set.add(board[r][c]);
        }
      }
      if (set.size !== 9 || set.has(0)) return false;
    }
  }
  return true;
}

function preservesGivens(input: Board, output: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (input[r][c] !== 0 && input[r][c] !== output[r][c]) return false;
    }
  }
  return true;
}

describe('solve', () => {
  test('簡単な問題を解ける', () => {
    const result = solve(easyPuzzle);
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(isCompleteSolution(result.board)).toBe(true);
      expect(preservesGivens(easyPuzzle, result.board)).toBe(true);
    }
  });

  test('中級問題を解ける', () => {
    const result = solve(mediumPuzzle);
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(isCompleteSolution(result.board)).toBe(true);
      expect(preservesGivens(mediumPuzzle, result.board)).toBe(true);
    }
  });

  test('難問（AI Escargot）を解ける', () => {
    const result = solve(hardPuzzle);
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(isCompleteSolution(result.board)).toBe(true);
      expect(preservesGivens(hardPuzzle, result.board)).toBe(true);
    }
  });

  test('完成済み盤面はそのまま返す', () => {
    const result = solve(completeBoard);
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.board).toEqual(completeBoard);
    }
  });

  test('空の盤面でも何らかの完全解を返す', () => {
    const result = solve(emptyBoard);
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(isCompleteSolution(result.board)).toBe(true);
    }
  });

  test('入力 Board は副作用で変更されない', () => {
    const input = cloneBoard(easyPuzzle);
    const before = JSON.stringify(input);
    solve(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  test('hard 問題でも 100ms 以内に解ける', () => {
    const result = solve(hardPuzzle);
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.durationMs).toBeLessThan(100);
    }
  });

  test('行に重複がある盤面は invalid', () => {
    const invalid = cloneBoard(easyPuzzle);
    invalid[0][2] = 5;
    const result = solve(invalid);
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') {
      expect(result.reason).toContain('行目');
    }
  });

  test('列に重複がある盤面は invalid', () => {
    const invalid = cloneBoard(easyPuzzle);
    invalid[2][0] = 5;
    const result = solve(invalid);
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') {
      expect(result.reason).toContain('列目');
    }
  });

  test('3x3ブロックに重複がある盤面は invalid', () => {
    const invalid = cloneBoard(easyPuzzle);
    invalid[2][2] = 5;
    const result = solve(invalid);
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') {
      expect(result.reason).toContain('ブロック');
    }
  });

  test('値域外の値（10）は invalid', () => {
    const invalid = cloneBoard(easyPuzzle);
    (invalid[0] as number[])[0] = 10;
    const result = solve(invalid);
    expect(result.status).toBe('invalid');
  });

  test('行数が9ではない盤面は invalid', () => {
    const tooFew = easyPuzzle.slice(0, 8);
    const result = solve(tooFew);
    expect(result.status).toBe('invalid');
  });

  test('解が存在しない盤面は unsolvable', () => {
    // [0][7] は行0の唯一の空きで 8 が必要だが、列7に 8 が既にある → 矛盾
    const unsolvable: Board = [
      [1, 2, 3, 4, 5, 6, 7, 0, 9],
      [0, 0, 0, 0, 0, 0, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const result = solve(unsolvable);
    expect(result.status).toBe('unsolvable');
  });
});
