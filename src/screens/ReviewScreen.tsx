import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, radius, space, tap } from '../theme/tokens';
import type { Board, Cell } from '../solver/types';

interface ReviewScreenProps {
  board: Board;
  onSolve: (editedBoard: Board) => void;
  onBack: () => void;
}

const BOARD_SIZE = 9;
const BOX_SIZE = 3;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function ReviewScreen({ board, onSolve, onBack }: ReviewScreenProps) {
  const [editedBoard, setEditedBoard] = useState<Board>(
    () => board.map((row) => [...row]) as Board
  );
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

  const handleCellPress = (r: number, c: number) => {
    setSelectedCell((prev) =>
      prev?.r === r && prev?.c === c ? null : { r, c }
    );
  };

  const handleDigitPress = (digit: Cell) => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    setEditedBoard((prev) => {
      const next = prev.map((row) => [...row]) as Board;
      next[r][c] = digit;
      return next;
    });
    setSelectedCell(null);
  };

  const handleClear = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    setEditedBoard((prev) => {
      const next = prev.map((row) => [...row]) as Board;
      next[r][c] = 0;
      return next;
    });
    setSelectedCell(null);
  };

  const handleDismiss = () => setSelectedCell(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OCR 結果を確認・修正</Text>
        <Text style={styles.subtitle}>セルをタップして数字を修正できます</Text>
      </View>

      <Pressable style={styles.gridContainer} onPress={handleDismiss}>
        <Grid
          board={editedBoard}
          selectedCell={selectedCell}
          onCellPress={handleCellPress}
        />
      </Pressable>

      {selectedCell && (
        <DigitPicker onDigitPress={handleDigitPress} onClear={handleClear} />
      )}

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.buttonSecondary, pressed && styles.pressed]}
          onPress={onBack}
          accessibilityRole="button"
        >
          <Text style={styles.buttonSecondaryText}>戻る</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => onSolve(editedBoard)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>解く →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface GridProps {
  board: Board;
  selectedCell: { r: number; c: number } | null;
  onCellPress: (r: number, c: number) => void;
}

function Grid({ board, selectedCell, onCellPress }: GridProps) {
  return (
    <View style={styles.grid}>
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => {
            const isRightBox = (c + 1) % BOX_SIZE === 0 && c < BOARD_SIZE - 1;
            const isBottomBox = (r + 1) % BOX_SIZE === 0 && r < BOARD_SIZE - 1;
            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            return (
              <Pressable
                key={c}
                style={[
                  styles.cell,
                  isRightBox && styles.cellBoxRight,
                  isBottomBox && styles.cellBoxBottom,
                  isSelected && styles.cellSelected,
                ]}
                onPress={() => onCellPress(r, c)}
                accessibilityRole="button"
                accessibilityLabel={`行${r + 1} 列${c + 1}: ${value === 0 ? '空' : value}`}
              >
                <Text style={[styles.cellText, isSelected && styles.cellTextSelected]}>
                  {value === 0 ? '' : String(value)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface DigitPickerProps {
  onDigitPress: (digit: Cell) => void;
  onClear: () => void;
}

function DigitPicker({ onDigitPress, onClear }: DigitPickerProps) {
  return (
    <View style={styles.picker}>
      {DIGITS.map((d) => (
        <Pressable
          key={d}
          style={({ pressed }) => [styles.pickerButton, pressed && styles.pressed]}
          onPress={() => onDigitPress(d as Cell)}
          accessibilityRole="button"
          accessibilityLabel={String(d)}
        >
          <Text style={styles.pickerButtonText}>{d}</Text>
        </Pressable>
      ))}
      <Pressable
        style={({ pressed }) => [styles.pickerButton, styles.pickerClear, pressed && styles.pressed]}
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="クリア"
      >
        <Text style={[styles.pickerButtonText, styles.pickerClearText]}>✕</Text>
      </Pressable>
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
  cellSelected: {
    backgroundColor: color.primary + '22',
  },
  cellText: {
    fontSize: fontSize.heading,
    color: color.text,
    fontWeight: '500',
  },
  cellTextSelected: {
    color: color.primary,
    fontWeight: '700',
  },
  picker: {
    flexDirection: 'row',
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
    gap: space.xs,
  },
  pickerButton: {
    flex: 1,
    minHeight: tap.minSize,
    borderRadius: radius.md,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerClear: {
    backgroundColor: color.surface,
    borderColor: color.border,
  },
  pickerButtonText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: color.text,
  },
  pickerClearText: {
    color: color.danger,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: space.md,
    paddingBottom: space.md,
    gap: space.sm,
  },
  button: {
    flex: 2,
    minHeight: tap.buttonHeight,
    borderRadius: radius.md,
    backgroundColor: color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    flex: 1,
    minHeight: tap.buttonHeight,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: color.white,
    fontSize: fontSize.button,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: color.text,
    fontSize: fontSize.button,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
