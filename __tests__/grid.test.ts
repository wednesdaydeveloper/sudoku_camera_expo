import { computeBoundingRect } from '../src/grid/cropToBoundingRect';
import type { Corners, ImageSize } from '../src/grid/types';

const imageSize: ImageSize = { width: 1000, height: 1000 };

describe('computeBoundingRect', () => {
  test('整列した4隅から正しい bounding rect を返す', () => {
    const corners: Corners = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 900, y: 100 },
      bottomRight: { x: 900, y: 900 },
      bottomLeft: { x: 100, y: 900 },
    };
    expect(computeBoundingRect(corners, imageSize)).toEqual({
      originX: 100,
      originY: 100,
      width: 800,
      height: 800,
    });
  });

  test('歪んだ4隅から外接矩形を返す', () => {
    const corners: Corners = {
      topLeft: { x: 100, y: 150 },
      topRight: { x: 950, y: 90 },
      bottomRight: { x: 920, y: 880 },
      bottomLeft: { x: 80, y: 920 },
    };
    const rect = computeBoundingRect(corners, imageSize);
    expect(rect.originX).toBe(80);
    expect(rect.originY).toBe(90);
    expect(rect.width).toBe(870);
    expect(rect.height).toBe(830);
  });

  test('画像外にはみ出た座標は画像サイズに clamp される', () => {
    const corners: Corners = {
      topLeft: { x: -50, y: -30 },
      topRight: { x: 1100, y: -10 },
      bottomRight: { x: 1200, y: 1100 },
      bottomLeft: { x: -20, y: 1050 },
    };
    expect(computeBoundingRect(corners, imageSize)).toEqual({
      originX: 0,
      originY: 0,
      width: 1000,
      height: 1000,
    });
  });

  test('小数座標は floor / ceil で整数化される', () => {
    const corners: Corners = {
      topLeft: { x: 100.7, y: 200.3 },
      topRight: { x: 800.2, y: 199.9 },
      bottomRight: { x: 799.5, y: 700.6 },
      bottomLeft: { x: 99.4, y: 701.1 },
    };
    const rect = computeBoundingRect(corners, imageSize);
    // ceil(800.2) - floor(99.4) = 801 - 99 = 702
    // ceil(701.1) - floor(199.9) = 702 - 199 = 503
    expect(rect.originX).toBe(99);
    expect(rect.originY).toBe(199);
    expect(rect.width).toBe(702);
    expect(rect.height).toBe(503);
  });
});
