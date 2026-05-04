import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { CellImageGrid, CellRect, ImageSize, SegmentOptions } from './types';
import type { Corners } from '../grid/types';

const BOARD_SIZE = 9;
const DEFAULT_INSET_RATIO = 0.12;
const CELL_EXPORT_WIDTH = 200;

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
 * 4隅の座標から双線形補間でセル (r, c) のクロップ矩形を算出する純関数。
 * 画像が斜めや台形に写っていても、盤面の格子に沿ったセル境界を推定できる。
 * - corners は元画像の座標系で指定する
 * - 結果は floor で整数化、画像範囲内に clamp
 */
export function computeCellRectFromCorners(
  row: number,
  col: number,
  corners: Corners,
  imageSize: ImageSize,
  insetRatio: number = DEFAULT_INSET_RATIO
): CellRect {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    throw new Error(`セル座標が範囲外です: (${row}, ${col})`);
  }
  const safeInset = Math.max(0, Math.min(0.49, insetRatio));

  const u0 = col / BOARD_SIZE;
  const u1 = (col + 1) / BOARD_SIZE;
  const v0 = row / BOARD_SIZE;
  const v1 = (row + 1) / BOARD_SIZE;

  const tl = bilinear(corners, u0, v0);
  const tr = bilinear(corners, u1, v0);
  const bl = bilinear(corners, u0, v1);
  const br = bilinear(corners, u1, v1);

  const minX = Math.min(tl.x, tr.x, bl.x, br.x);
  const maxX = Math.max(tl.x, tr.x, bl.x, br.x);
  const minY = Math.min(tl.y, tr.y, bl.y, br.y);
  const maxY = Math.max(tl.y, tr.y, bl.y, br.y);

  const w = maxX - minX;
  const h = maxY - minY;
  const insetX = w * safeInset;
  const insetY = h * safeInset;

  // originX/Y は [0, imageSize - 1] に clamp して origin + size が画像外に出ないようにする
  const originX = Math.min(imageSize.width - 1, Math.max(0, Math.floor(minX + insetX)));
  const originY = Math.min(imageSize.height - 1, Math.max(0, Math.floor(minY + insetY)));
  const width = Math.max(
    1,
    Math.min(imageSize.width - originX, Math.floor(w - 2 * insetX))
  );
  const height = Math.max(
    1,
    Math.min(imageSize.height - originY, Math.floor(h - 2 * insetY))
  );
  return { originX, originY, width, height };
}

function bilinear(
  corners: Corners,
  u: number,
  v: number
): { x: number; y: number } {
  const { topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br } = corners;
  return {
    x: (1 - u) * (1 - v) * tl.x + u * (1 - v) * tr.x + (1 - u) * v * bl.x + u * v * br.x,
    y: (1 - u) * (1 - v) * tl.y + u * (1 - v) * tr.y + (1 - u) * v * bl.y + u * v * br.y,
  };
}

async function cropAndResize(
  imageUri: string,
  rect: CellRect
): Promise<string> {
  const ref = await ImageManipulator.manipulate(imageUri)
    .crop(rect)
    .resize({ width: CELL_EXPORT_WIDTH })
    .renderAsync();
  const saved = await ref.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
  return saved.uri;
}

/**
 * 4隅の座標から双線形補間でセルを分割する（透視歪み対応版）。
 * 元画像の URI と corners（元画像座標系）を直接受け取り、
 * 中間クロップを介さずに 81 セルを切り出す。
 * メモリ圧力を避けるため 1行9セルずつ逐次処理する。
 */
export async function segmentBoardFromCorners(
  imageUri: string,
  corners: Corners,
  imageSize: ImageSize,
  options: SegmentOptions = {}
): Promise<CellImageGrid> {
  const insetRatio = options.insetRatio ?? DEFAULT_INSET_RATIO;
  const grid: CellImageGrid = Array.from({ length: BOARD_SIZE }, () =>
    Array<string>(BOARD_SIZE).fill('')
  );
  for (let row = 0; row < BOARD_SIZE; row++) {
    const uris = await Promise.all(
      Array.from({ length: BOARD_SIZE }, (_, col) =>
        cropAndResize(imageUri, computeCellRectFromCorners(row, col, corners, imageSize, insetRatio))
      )
    );
    for (let col = 0; col < BOARD_SIZE; col++) {
      grid[row][col] = uris[col];
    }
  }
  return grid;
}
