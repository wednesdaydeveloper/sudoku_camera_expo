import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { color, fontSize, radius, space, tap } from '../theme/tokens';
import type { Corners, ImageSize, Point } from '../grid/types';

interface CornerPickerScreenProps {
  imageUri: string;
  /** 自動検出された初期コーナー（画像座標系）。未指定時は 10% インセット */
  initialCorners?: Corners;
  onCancel: () => void;
  onConfirm: (corners: Corners, naturalSize: ImageSize) => void;
}

const HANDLE_HIT_SIZE = 44;
const HANDLE_VISUAL_SIZE = 24;

interface DisplayLayout {
  offsetX: number;
  offsetY: number;
  imageWidth: number;
  imageHeight: number;
}

function computeContainLayout(natural: ImageSize, container: ImageSize): DisplayLayout {
  const containerRatio = container.width / container.height;
  const imageRatio = natural.width / natural.height;
  let imageWidth: number;
  let imageHeight: number;
  if (imageRatio > containerRatio) {
    imageWidth = container.width;
    imageHeight = container.width / imageRatio;
  } else {
    imageHeight = container.height;
    imageWidth = container.height * imageRatio;
  }
  return {
    imageWidth,
    imageHeight,
    offsetX: (container.width - imageWidth) / 2,
    offsetY: (container.height - imageHeight) / 2,
  };
}

function clampToImage(p: Point, layout: DisplayLayout): Point {
  return {
    x: Math.max(layout.offsetX, Math.min(layout.offsetX + layout.imageWidth, p.x)),
    y: Math.max(layout.offsetY, Math.min(layout.offsetY + layout.imageHeight, p.y)),
  };
}

export function CornerPickerScreen({
  imageUri,
  initialCorners,
  onCancel,
  onConfirm,
}: CornerPickerScreenProps) {
  const [naturalSize, setNaturalSize] = useState<ImageSize | null>(null);
  const [containerSize, setContainerSize] = useState<ImageSize | null>(null);
  const [corners, setCorners] = useState<Corners | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    Image.getSize(
      imageUri,
      (w, h) => setNaturalSize({ width: w, height: h }),
      () => Alert.alert('画像を読み込めませんでした')
    );
  }, [imageUri]);

  const layout =
    naturalSize && containerSize ? computeContainLayout(naturalSize, containerSize) : null;

  useEffect(() => {
    if (!layout || corners) return;
    if (initialCorners && naturalSize) {
      // 画像座標 → 表示座標に変換して初期コーナーとして使う
      const scale = layout.imageWidth / naturalSize.width;
      const toDisplay = (p: Point): Point => ({
        x: p.x * scale + layout.offsetX,
        y: p.y * scale + layout.offsetY,
      });
      setCorners({
        topLeft:     toDisplay(initialCorners.topLeft),
        topRight:    toDisplay(initialCorners.topRight),
        bottomRight: toDisplay(initialCorners.bottomRight),
        bottomLeft:  toDisplay(initialCorners.bottomLeft),
      });
    } else {
      const inset = { x: layout.imageWidth * 0.1, y: layout.imageHeight * 0.1 };
      setCorners({
        topLeft:     { x: layout.offsetX + inset.x,                         y: layout.offsetY + inset.y },
        topRight:    { x: layout.offsetX + layout.imageWidth - inset.x,      y: layout.offsetY + inset.y },
        bottomRight: { x: layout.offsetX + layout.imageWidth - inset.x,      y: layout.offsetY + layout.imageHeight - inset.y },
        bottomLeft:  { x: layout.offsetX + inset.x,                         y: layout.offsetY + layout.imageHeight - inset.y },
      });
    }
  }, [layout, corners, initialCorners, naturalSize]);

  const updateCorner = (key: keyof Corners, p: Point) => {
    setCorners((current) => {
      if (!current || !layout) return current;
      return { ...current, [key]: clampToImage(p, layout) };
    });
  };

  const handleConfirm = () => {
    if (!corners || !layout || !naturalSize || processing) return;
    setProcessing(true);
    const scale = naturalSize.width / layout.imageWidth;
    const toImage = (p: Point): Point => ({
      x: (p.x - layout.offsetX) * scale,
      y: (p.y - layout.offsetY) * scale,
    });
    const imageCorners: Corners = {
      topLeft:     toImage(corners.topLeft),
      topRight:    toImage(corners.topRight),
      bottomRight: toImage(corners.bottomRight),
      bottomLeft:  toImage(corners.bottomLeft),
    };
    onConfirm(imageCorners, naturalSize);
    // setProcessing(false) は不要: onConfirm により親がナビゲーションを実行し
    // このコンポーネントはアンマウントされる。同期的にリセットすると
    // React のバッチ処理により processing が true になる前に false に戻る。
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </Pressable>
        <Text style={styles.title}>4隅を盤面に合わせる</Text>
      </View>

      <View
        style={styles.imageArea}
        onLayout={(e) =>
          setContainerSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {!naturalSize && <ActivityIndicator color={color.primary} />}
        {naturalSize && layout && (
          <Image
            source={{ uri: imageUri }}
            style={{
              position: 'absolute',
              left: layout.offsetX,
              top: layout.offsetY,
              width: layout.imageWidth,
              height: layout.imageHeight,
            }}
          />
        )}
        {corners && layout && (
          <>
            <Edge from={corners.topLeft} to={corners.topRight} />
            <Edge from={corners.topRight} to={corners.bottomRight} />
            <Edge from={corners.bottomRight} to={corners.bottomLeft} />
            <Edge from={corners.bottomLeft} to={corners.topLeft} />
            <CornerHandle
              point={corners.topLeft}
              onMove={(p) => updateCorner('topLeft', p)}
              label="左上"
            />
            <CornerHandle
              point={corners.topRight}
              onMove={(p) => updateCorner('topRight', p)}
              label="右上"
            />
            <CornerHandle
              point={corners.bottomRight}
              onMove={(p) => updateCorner('bottomRight', p)}
              label="右下"
            />
            <CornerHandle
              point={corners.bottomLeft}
              onMove={(p) => updateCorner('bottomLeft', p)}
              label="左下"
            />
          </>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}
          onPress={onCancel}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>戻る</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            (processing || !corners) && styles.disabled,
            pressed && styles.pressed,
          ]}
          onPress={handleConfirm}
          disabled={processing || !corners}
          accessibilityRole="button"
        >
          {processing ? (
            <ActivityIndicator color={color.white} />
          ) : (
            <Text style={styles.primaryButtonText}>確定 →</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface CornerHandleProps {
  point: Point;
  onMove: (p: Point) => void;
  label: string;
}

function CornerHandle({ point, onMove, label }: CornerHandleProps) {
  // ドラッグ中の親再レンダで PanResponder のクロージャが古い point/onMove を
  // 参照しないよう、毎レンダで ref を更新する。startRef はジェスチャ開始時に
  // のみ確定させ、ジェスチャ中は触らない（gesture.dx/dy が累積値のため）。
  const pointRef = useRef(point);
  pointRef.current = point;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const startRef = useRef<Point>(point);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = pointRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        onMoveRef.current({
          x: startRef.current.x + gesture.dx,
          y: startRef.current.y + gesture.dy,
        });
      },
    })
  ).current;

  return (
    <View
      {...responder.panHandlers}
      accessibilityLabel={`${label}のハンドル`}
      accessibilityRole="adjustable"
      style={{
        position: 'absolute',
        left: point.x - HANDLE_HIT_SIZE / 2,
        top: point.y - HANDLE_HIT_SIZE / 2,
        width: HANDLE_HIT_SIZE,
        height: HANDLE_HIT_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={styles.handleVisual} />
    </View>
  );
}

interface EdgeProps {
  from: Point;
  to: Point;
}

function Edge({ from, to }: EdgeProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: cx - length / 2,
        top: cy - 1,
        width: length,
        height: 2,
        backgroundColor: color.primary,
        opacity: 0.85,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  header: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  backButton: {
    paddingVertical: space.xs,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: fontSize.body,
    color: color.primary,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: color.text,
    marginTop: space.xs,
  },
  imageArea: {
    flex: 1,
    backgroundColor: color.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleVisual: {
    width: HANDLE_VISUAL_SIZE,
    height: HANDLE_VISUAL_SIZE,
    borderRadius: HANDLE_VISUAL_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 3,
    borderColor: color.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: space.md,
    paddingBottom: space.md,
    gap: space.sm,
  },
  button: {
    flex: 1,
    minHeight: tap.buttonHeight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: color.primary,
  },
  primaryButtonText: {
    color: color.white,
    fontSize: fontSize.button,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  secondaryButtonText: {
    color: color.text,
    fontSize: fontSize.button,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
