import { SudokuDetector } from 'sudoku-detector';
import type { Corners } from '../grid/types';
import type { ImageSize } from './types';

/** confidence がこの値以上ならネイティブ検出を採用する（低信頼度でもフォールバックより有用） */
const NATIVE_CONFIDENCE_THRESHOLD = 0.1;

function fallbackCorners(imageSize: ImageSize, expandRatio = 0): Corners {
  // 5% インセットは画像端すぎて調整が難しいため 20% を基準にする
  const ix = imageSize.width * Math.max(0, 0.20 - expandRatio);
  const iy = imageSize.height * Math.max(0, 0.20 - expandRatio);
  return {
    topLeft:     { x: ix,                        y: iy },
    topRight:    { x: imageSize.width - ix,       y: iy },
    bottomRight: { x: imageSize.width - ix,       y: imageSize.height - iy },
    bottomLeft:  { x: ix,                        y: imageSize.height - iy },
  };
}

export function expandCorners(corners: Corners, imageSize: ImageSize, ratio: number): Corners {
  if (ratio === 0) return corners;
  const cx = (corners.topLeft.x + corners.topRight.x + corners.bottomLeft.x + corners.bottomRight.x) / 4;
  const cy = (corners.topLeft.y + corners.topRight.y + corners.bottomLeft.y + corners.bottomRight.y) / 4;
  const expand = (pt: { x: number; y: number }) => ({
    x: Math.max(0, Math.min(imageSize.width,  cx + (pt.x - cx) * (1 + ratio))),
    y: Math.max(0, Math.min(imageSize.height, cy + (pt.y - cy) * (1 + ratio))),
  });
  return {
    topLeft:     expand(corners.topLeft),
    topRight:    expand(corners.topRight),
    bottomRight: expand(corners.bottomRight),
    bottomLeft:  expand(corners.bottomLeft),
  };
}

/**
 * iOS Vision Framework (VNDetectRectanglesRequest) で盤面の 4 隅を検出する。
 * - 信頼度が NATIVE_CONFIDENCE_THRESHOLD 未満の場合はフォールバックを返す
 * - expandRatio > 0 で検出コーナーを中心から外側に広げる（再試行用）
 */
export async function detectSudokuCorners(
  imageUri: string,
  imageSize: ImageSize,
  expandRatio = 0
): Promise<Corners> {
  try {
    const detected = await SudokuDetector.detectGrid(imageUri);

    if (detected.confidence >= NATIVE_CONFIDENCE_THRESHOLD) {
      const corners: Corners = {
        topLeft:     detected.topLeft,
        topRight:    detected.topRight,
        bottomRight: detected.bottomRight,
        bottomLeft:  detected.bottomLeft,
      };
      return expandRatio > 0
        ? expandCorners(corners, imageSize, expandRatio)
        : corners;
    }

    return fallbackCorners(imageSize, expandRatio);
  } catch {
    return fallbackCorners(imageSize, expandRatio);
  }
}
