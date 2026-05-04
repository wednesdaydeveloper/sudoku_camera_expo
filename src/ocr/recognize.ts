import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import type { Board, Cell } from '../solver/types';
import type { CellImageGrid } from './types';

/**
 * ML Kit が返す任意のテキストから 1 桁数字（1〜9）を抽出する。
 * - 空白を除いた最初の数字を採用
 * - 1〜9 以外（0 や複数桁、記号、英字のみ）は空欄扱い（0）
 *
 * 純関数として単体テスト可能。
 */
export function parseDigitFromText(text: string): Cell {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  for (const ch of trimmed) {
    if (ch >= '1' && ch <= '9') {
      return Number.parseInt(ch, 10) as Cell;
    }
  }
  return 0;
}

async function recognizeCell(cellUri: string): Promise<Cell> {
  try {
    const result = await TextRecognition.recognize(cellUri, TextRecognitionScript.LATIN);
    return parseDigitFromText(result.text);
  } catch {
    return 0;
  }
}

/**
 * 81 セルの画像から数字を認識し、9x9 の Board を返す。
 * 1行9セルずつ逐次処理することで ML Kit への同時リクエスト数を抑える。
 * 失敗したセルは 0（空欄）扱い。
 */
export async function recognizeBoard(cellImages: CellImageGrid): Promise<Board> {
  const board: Board = Array.from({ length: 9 }, () => Array<Cell>(9).fill(0));
  for (let row = 0; row < 9; row++) {
    const rowDigits = await Promise.all(
      Array.from({ length: 9 }, (_, col) => recognizeCell(cellImages[row][col]))
    );
    for (let col = 0; col < 9; col++) {
      board[row][col] = rowDigits[col];
    }
  }
  return board;
}
