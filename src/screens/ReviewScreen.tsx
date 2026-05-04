import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, radius, space, tap } from '../theme/tokens';
import type { Board } from '../solver/types';

interface ReviewScreenProps {
  board: Board;
  onBack: () => void;
}

const BOARD_SIZE = 9;
const BOX_SIZE = 3;

/**
 * Phase 5 の暫定 Review 画面。OCR 結果を 9x9 で表示するのみ（編集不可）。
 * Phase 6 でタップ修正・「解く」遷移を実装予定。
 */
export function ReviewScreen({ board, onBack }: ReviewScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OCR 結果（仮表示）</Text>
        <Text style={styles.subtitle}>
          Phase 6 でタップ修正・「解く」を実装します
        </Text>
      </View>

      <View style={styles.gridContainer}>
        <Grid board={board} />
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={onBack}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>ホームへ戻る</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface GridProps {
  board: Board;
}

function Grid({ board }: GridProps) {
  return (
    <View style={styles.grid}>
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => {
            const isRightBoxBoundary = (c + 1) % BOX_SIZE === 0 && c < BOARD_SIZE - 1;
            const isBottomBoxBoundary = (r + 1) % BOX_SIZE === 0 && r < BOARD_SIZE - 1;
            return (
              <View
                key={c}
                style={[
                  styles.cell,
                  isRightBoxBoundary && styles.cellBoxRight,
                  isBottomBoxBoundary && styles.cellBoxBottom,
                ]}
              >
                <Text style={styles.cellText}>{value === 0 ? '' : String(value)}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
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
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: '700',
    color: color.text,
  },
  subtitle: {
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: space.xs,
  },
  gridContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.md,
  },
  grid: {
    aspectRatio: 1,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: color.text,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBoxRight: {
    borderRightWidth: 2,
    borderRightColor: color.text,
  },
  cellBoxBottom: {
    borderBottomWidth: 2,
    borderBottomColor: color.text,
  },
  cellText: {
    fontSize: fontSize.heading,
    color: color.text,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  button: {
    flex: 1,
    minHeight: tap.buttonHeight,
    borderRadius: radius.md,
    backgroundColor: color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: color.white,
    fontSize: fontSize.button,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
