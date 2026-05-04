import { Board, Cell, SolveResult, BOARD_SIZE, BOX_SIZE } from './types';
import { validate } from './validate';

interface SolverState {
  grid: Uint8Array;
  rowMask: Uint16Array;
  colMask: Uint16Array;
  boxMask: Uint16Array;
}

const ALL_CANDIDATES_MASK = 0b1111111110;

function boxIndex(r: number, c: number): number {
  return Math.floor(r / BOX_SIZE) * BOX_SIZE + Math.floor(c / BOX_SIZE);
}

function buildState(board: Board): SolverState {
  const state: SolverState = {
    grid: new Uint8Array(BOARD_SIZE * BOARD_SIZE),
    rowMask: new Uint16Array(BOARD_SIZE),
    colMask: new Uint16Array(BOARD_SIZE),
    boxMask: new Uint16Array(BOARD_SIZE),
  };
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = board[r][c];
      state.grid[r * BOARD_SIZE + c] = v;
      if (v !== 0) {
        const bit = 1 << v;
        state.rowMask[r] |= bit;
        state.colMask[c] |= bit;
        state.boxMask[boxIndex(r, c)] |= bit;
      }
    }
  }
  return state;
}

function popcount(x: number): number {
  let n = x;
  let count = 0;
  while (n) {
    n &= n - 1;
    count++;
  }
  return count;
}

interface MRVResult {
  r: number;
  c: number;
  candidates: number;
}

function findMRVCell(state: SolverState): MRVResult | null {
  let bestR = -1;
  let bestC = -1;
  let bestCount = 10;
  let bestCandidates = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (state.grid[r * BOARD_SIZE + c] !== 0) continue;
      const used =
        state.rowMask[r] | state.colMask[c] | state.boxMask[boxIndex(r, c)];
      const candidates = ~used & ALL_CANDIDATES_MASK;
      const count = popcount(candidates);
      if (count === 0) {
        return { r, c, candidates: 0 };
      }
      if (count < bestCount) {
        bestCount = count;
        bestR = r;
        bestC = c;
        bestCandidates = candidates;
        if (count === 1) {
          return { r: bestR, c: bestC, candidates: bestCandidates };
        }
      }
    }
  }
  if (bestR === -1) return null;
  return { r: bestR, c: bestC, candidates: bestCandidates };
}

function backtrack(state: SolverState): boolean {
  const cell = findMRVCell(state);
  if (cell === null) return true;
  if (cell.candidates === 0) return false;
  const { r, c } = cell;
  const idx = r * BOARD_SIZE + c;
  const bi = boxIndex(r, c);
  let candidates = cell.candidates;
  while (candidates) {
    const bit = candidates & -candidates;
    candidates ^= bit;
    const digit = Math.log2(bit) as Cell;
    state.grid[idx] = digit;
    state.rowMask[r] |= bit;
    state.colMask[c] |= bit;
    state.boxMask[bi] |= bit;
    if (backtrack(state)) return true;
    state.grid[idx] = 0;
    state.rowMask[r] ^= bit;
    state.colMask[c] ^= bit;
    state.boxMask[bi] ^= bit;
  }
  return false;
}

function stateToBoard(state: SolverState): Board {
  const board: Cell[][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push(state.grid[r * BOARD_SIZE + c] as Cell);
    }
    board.push(row);
  }
  return board;
}

function now(): number {
  if (typeof globalThis.performance !== 'undefined' && typeof globalThis.performance.now === 'function') {
    return globalThis.performance.now();
  }
  return Date.now();
}

export function solve(board: Board): SolveResult {
  const validationError = validate(board);
  if (validationError) {
    return { status: 'invalid', reason: validationError.reason };
  }
  const start = now();
  const state = buildState(board);
  const ok = backtrack(state);
  const durationMs = now() - start;
  if (!ok) {
    return { status: 'unsolvable', durationMs };
  }
  return { status: 'solved', board: stateToBoard(state), durationMs };
}
