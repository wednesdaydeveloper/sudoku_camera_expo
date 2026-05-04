import type { ImageSize } from '../grid/types';

export type CellImageGrid = string[][];

export interface CellRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface SegmentOptions {
  /** セル境界からの内側マージン比率（0〜0.49）。罫線を避けるため。デフォルト 0.12 */
  insetRatio?: number;
}

export type { ImageSize };
