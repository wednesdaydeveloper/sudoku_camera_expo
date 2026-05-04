export interface Point {
  x: number;
  y: number;
}

export interface Corners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface BoundingRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}
