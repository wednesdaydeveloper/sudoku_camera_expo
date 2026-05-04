import { requireNativeModule } from 'expo-modules-core';

export interface CornerPoint {
  x: number;
  y: number;
}

export interface DetectedGrid {
  topLeft: CornerPoint;
  topRight: CornerPoint;
  bottomRight: CornerPoint;
  bottomLeft: CornerPoint;
  /** 0–1 の信頼度。ネイティブ検出が成功した場合は > 0、フォールバック時は 0 */
  confidence: number;
}

interface SudokuDetectorNative {
  detectGrid(imageUri: string): Promise<DetectedGrid>;
}

export const SudokuDetector = requireNativeModule<SudokuDetectorNative>('SudokuDetector');
