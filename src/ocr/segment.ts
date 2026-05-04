import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { CellImageGrid, CellRect, ImageSize, SegmentOptions } from './types';

const BOARD_SIZE = 9;
const DEFAULT_INSET_RATIO = 0.1;

/**
 * セル (r, c) のクロップ矩形を算出する純関数。
 * - 画像を 9x9 に等分し、各セルの内側に inset を取る
 * - 結果は floor で整数化、画像範囲内に clamp
 */
export function computeCellRect(
  row: number,
  col: number,
  imageSize: ImageSize,
  insetRatio: number = DEFAULT_INSET_RATIO
): CellRect {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    throw new Error(`セル座標が範囲外です: (${row}, ${col})`);
  }
  const safeInset = Math.max(0, Math.min(0.49, insetRatio));
  const cellWidth = imageSize.width / BOARD_SIZE;
  const cellHeight = imageSize.height / BOARD_SIZE;
  const insetX = cellWidth * safeInset;
  const insetY = cellHeight * safeInset;
  const originX = Math.max(0, Math.floor(col * cellWidth + insetX));
  const originY = Math.max(0, Math.floor(row * cellHeight + insetY));
  const width = Math.max(
    1,
    Math.min(imageSize.width - originX, Math.floor(cellWidth - 2 * insetX))
  );
  const height = Math.max(
    1,
    Math.min(imageSize.height - originY, Math.floor(cellHeight - 2 * insetY))
  );
  return { originX, originY, width, height };
}

/**
 * 盤面画像を 9x9 のセル画像に分割する。各セルを JPEG として一時ファイルに書き出し、URI を返す。
 */
export async function segmentBoard(
  imageUri: string,
  imageSize: ImageSize,
  options: SegmentOptions = {}
): Promise<CellImageGrid> {
  const insetRatio = options.insetRatio ?? DEFAULT_INSET_RATIO;
  const tasks: Promise<{ row: number; col: number; uri: string }>[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const rect = computeCellRect(row, col, imageSize, insetRatio);
      tasks.push(
        ImageManipulator.manipulate(imageUri)
          .crop(rect)
          .renderAsync()
          .then((ref) => ref.saveAsync({ compress: 0.9, format: SaveFormat.JPEG }))
          .then((result) => ({ row, col, uri: result.uri }))
      );
    }
  }
  const results = await Promise.all(tasks);
  const grid: CellImageGrid = Array.from({ length: BOARD_SIZE }, () =>
    Array<string>(BOARD_SIZE).fill('')
  );
  for (const { row, col, uri } of results) {
    grid[row][col] = uri;
  }
  return grid;
}
