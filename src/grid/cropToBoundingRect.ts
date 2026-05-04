import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { BoundingRect, Corners, ImageSize } from './types';

export interface CropResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * 4 隅の座標から軸並行な bounding rect を算出する。
 * 結果は画像サイズ内に clamp され、整数化される。
 */
export function computeBoundingRect(
  corners: Corners,
  imageSize: ImageSize
): BoundingRect {
  const xs = [
    corners.topLeft.x,
    corners.topRight.x,
    corners.bottomRight.x,
    corners.bottomLeft.x,
  ];
  const ys = [
    corners.topLeft.y,
    corners.topRight.y,
    corners.bottomRight.y,
    corners.bottomLeft.y,
  ];
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxX = Math.min(imageSize.width, Math.ceil(Math.max(...xs)));
  const maxY = Math.min(imageSize.height, Math.ceil(Math.max(...ys)));
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  return { originX: minX, originY: minY, width, height };
}

export async function cropToBoundingRect(
  imageUri: string,
  corners: Corners,
  imageSize: ImageSize
): Promise<CropResult> {
  const rect = computeBoundingRect(corners, imageSize);
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error('クロップ範囲が不正です');
  }
  const ref = await ImageManipulator.manipulate(imageUri).crop(rect).renderAsync();
  const result = await ref.saveAsync({ compress: 1, format: SaveFormat.JPEG });
  return { uri: result.uri, width: result.width, height: result.height };
}
