import { Board, BOARD_SIZE, BOX_SIZE, Cell } from './types';

export interface ValidationError {
  reason: string;
}

export function validateShape(board: Board): ValidationError | null {
  if (!Array.isArray(board) || board.length !== BOARD_SIZE) {
    return { reason: `盤面は${BOARD_SIZE}行である必要があります` };
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = board[r];
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) {
      return { reason: `${r + 1}行目は${BOARD_SIZE}列である必要があります` };
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = row[c];
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 9) {
        return { reason: `(${r + 1}, ${c + 1}) の値が不正です: ${String(v)}` };
      }
    }
  }
  return null;
}

export function validateConstraints(board: Board): ValidationError | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    const seen = new Set<Cell>();
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = board[r][c];
      if (v === 0) continue;
      if (seen.has(v)) {
        return { reason: `${r + 1}行目で数字${v}が重複しています` };
      }
      seen.add(v);
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    const seen = new Set<Cell>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      const v = board[r][c];
      if (v === 0) continue;
      if (seen.has(v)) {
        return { reason: `${c + 1}列目で数字${v}が重複しています` };
      }
      seen.add(v);
    }
  }
  for (let br = 0; br < BOX_SIZE; br++) {
    for (let bc = 0; bc < BOX_SIZE; bc++) {
      const seen = new Set<Cell>();
      for (let r = br * BOX_SIZE; r < br * BOX_SIZE + BOX_SIZE; r++) {
        for (let c = bc * BOX_SIZE; c < bc * BOX_SIZE + BOX_SIZE; c++) {
          const v = board[r][c];
          if (v === 0) continue;
          if (seen.has(v)) {
            return {
              reason: `(${br + 1}, ${bc + 1})ブロックで数字${v}が重複しています`,
            };
          }
          seen.add(v);
        }
      }
    }
  }
  return null;
}

export function validate(board: Board): ValidationError | null {
  const shapeError = validateShape(board);
  if (shapeError) return shapeError;
  return validateConstraints(board);
}
