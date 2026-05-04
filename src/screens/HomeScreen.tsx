import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, radius, space, tap } from '../theme/tokens';

interface HomeScreenProps {
  onPressCapture: () => void;
  onPressPickPhoto: () => void;
}

export function HomeScreen({ onPressCapture, onPressPickPhoto }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>数独カメラ</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIllustration}>
          <Text style={styles.heroEmoji}>🧩</Text>
        </View>
        <Text style={styles.heroTitle}>数独問題を解こう</Text>
        <Text style={styles.heroSubtitle}>撮るだけで答えが出ます</Text>
        <Text style={styles.heroNote}>ⓘ 印刷物の数独に対応</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.pressed]}
          onPress={onPressCapture}
          accessibilityRole="button"
          accessibilityLabel="カメラで撮影する"
        >
          <Text style={styles.buttonIcon}>📷</Text>
          <Text style={styles.buttonLabelPrimary}>撮影</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && styles.pressed]}
          onPress={onPressPickPhoto}
          accessibilityRole="button"
          accessibilityLabel="写真ライブラリから選ぶ"
        >
          <Text style={styles.buttonIcon}>🖼️</Text>
          <Text style={styles.buttonLabelSecondary}>選ぶ</Text>
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
    paddingBottom: space.sm,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: color.text,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  heroIllustration: {
    width: 200,
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  heroEmoji: {
    fontSize: 96,
  },
  heroTitle: {
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: color.text,
    marginBottom: space.xs,
  },
  heroSubtitle: {
    fontSize: fontSize.body,
    color: color.textMuted,
    marginBottom: space.lg,
  },
  heroNote: {
    fontSize: fontSize.caption,
    color: color.textMuted,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonPrimary: {
    backgroundColor: color.primary,
  },
  buttonSecondary: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  buttonIcon: {
    fontSize: 22,
  },
  buttonLabelPrimary: {
    fontSize: fontSize.button,
    fontWeight: '600',
    color: color.white,
  },
  buttonLabelSecondary: {
    fontSize: fontSize.button,
    fontWeight: '600',
    color: color.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
