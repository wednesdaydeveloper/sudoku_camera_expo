import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, radius, space, tap } from '../theme/tokens';
import type { Board } from '../solver/types';

interface ResultScreenProps {
  solvedBoard: Board;
  confirmedBoard: Board;
  onRetry: () => void;
}

const BOARD_SIZE = 9;
const BOX_SIZE = 3;

export function ResultScreen({ solvedBoard, confirmedBoard, onRetry }: ResultScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>解けました！</Text>
        <Text style={styles.subtitle}>黒: ヒント数字　青: 解答</Text>
      </View>

      <View style={styles.gridContainer}>
        <Grid solvedBoard={solvedBoard} confirmedBoard={confirmedBoard} />
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={onRetry}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>最初からやり直す</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface GridProps {
  solvedBoard: Board;
  confirmedBoard: Board;
}

function Grid({ solvedBoard, confirmedBoard }: GridProps) {
  return (
    <View style={styles.grid}>
      {solvedBoard.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => {
            const isRightBox = (c + 1) % BOX_SIZE === 0 && c < BOARD_SIZE - 1;
            const isBottomBox = (r + 1) % BOX_SIZE === 0 && r < BOARD_SIZE - 1;
            const isGiven = confirmedBoard[r][c] !== 0;
            return (
              <View
                key={c}
                style={[
                  styles.cell,
                  isRightBox && styles.cellBoxRight,
                  isBottomBox && styles.cellBoxBottom,
                ]}
              >
                <Text style={[styles.cellText, !isGiven && styles.cellTextSolved]}>
                  {String(value)}
                </Text>
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
    paddingBottom: space.sm,
  },
  title: {
    fontSize: fontSize.title,
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
  cellTextSolved: {
    color: color.primary,
    fontWeight: '400',
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
