import { computeCellRect } from '../src/ocr/segment';
import { parseDigitFromText } from '../src/ocr/recognize';
import type { ImageSize } from '../src/grid/types';

describe('computeCellRect', () => {
  const imageSize: ImageSize = { width: 900, height: 900 };

  test('(0,0) セルは画像左上の 1/9 領域に inset を引いたもの', () => {
    const rect = computeCellRect(0, 0, imageSize, 0.1);
    // cellSize = 100, inset = 10
    expect(rect.originX).toBe(10);
    expect(rect.originY).toBe(10);
    expect(rect.width).toBe(80);
    expect(rect.height).toBe(80);
  });

  test('(8,8) セルは画像右下の 1/9 領域', () => {
    const rect = computeCellRect(8, 8, imageSize, 0.1);
    // 8 * 100 + 10 = 810
    expect(rect.originX).toBe(810);
    expect(rect.originY).toBe(810);
    expect(rect.width).toBe(80);
    expect(rect.height).toBe(80);
  });

  test('(4,3) セルの座標が正しい', () => {
    const rect = computeCellRect(4, 3, imageSize, 0.1);
    expect(rect.originX).toBe(310); // 3*100 + 10
    expect(rect.originY).toBe(410); // 4*100 + 10
    expect(rect.width).toBe(80);
    expect(rect.height).toBe(80);
  });

  test('inset=0 ならセル全体', () => {
    const rect = computeCellRect(0, 0, imageSize, 0);
    expect(rect).toEqual({ originX: 0, originY: 0, width: 100, height: 100 });
  });

  test('範囲外のセル指定は例外', () => {
    expect(() => computeCellRect(-1, 0, imageSize)).toThrow();
    expect(() => computeCellRect(0, 9, imageSize)).toThrow();
    expect(() => computeCellRect(9, 9, imageSize)).toThrow();
  });

  test('インセット比率は 0.49 で頭打ち', () => {
    const rect = computeCellRect(0, 0, imageSize, 0.9);
    // 0.49 で clamp されるので inset = 49, width = 100 - 98 = 2
    expect(rect.width).toBeGreaterThanOrEqual(1);
    expect(rect.height).toBeGreaterThanOrEqual(1);
  });
});

describe('parseDigitFromText', () => {
  test('単一の数字 1-9 はそのまま返す', () => {
    for (let i = 1; i <= 9; i++) {
      expect(parseDigitFromText(String(i))).toBe(i);
    }
  });

  test('空文字は 0', () => {
    expect(parseDigitFromText('')).toBe(0);
    expect(parseDigitFromText('   ')).toBe(0);
  });

  test('0 は空欄扱い', () => {
    expect(parseDigitFromText('0')).toBe(0);
  });

  test('文字列内の最初の 1-9 を抽出', () => {
    expect(parseDigitFromText('5\n')).toBe(5);
    expect(parseDigitFromText(' 7 ')).toBe(7);
    expect(parseDigitFromText('|3|')).toBe(3);
  });

  test('英字や記号のみは空欄', () => {
    expect(parseDigitFromText('abc')).toBe(0);
    expect(parseDigitFromText('!@#')).toBe(0);
  });

  test('複数桁でも最初の 1-9 を採用', () => {
    expect(parseDigitFromText('45')).toBe(4);
    expect(parseDigitFromText('109')).toBe(1);
  });
});
