import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, radius, space, tap } from '../theme/tokens';

interface ImagePreviewScreenProps {
  imageUri: string;
  onRetry: () => void;
  onProceed: () => void;
}

export function ImagePreviewScreen({ imageUri, onRetry, onProceed }: ImagePreviewScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </Pressable>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>

      <Text style={styles.note}>解析できそうな状態か確認してください</Text>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}
          onPress={onRetry}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>撮り直す</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}
          onPress={onProceed}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>次へ →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
  backButton: {
    paddingVertical: space.sm,
    paddingRight: space.sm,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: fontSize.body,
    color: color.primary,
  },
  imageContainer: {
    flex: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: color.surface,
    borderRadius: radius.md,
  },
  note: {
    fontSize: fontSize.body,
    color: color.textMuted,
    textAlign: 'center',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
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
});
