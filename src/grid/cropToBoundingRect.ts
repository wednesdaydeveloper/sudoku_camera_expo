import type { BoundingRect, Corners, ImageSize } from './types';

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
