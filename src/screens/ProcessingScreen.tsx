import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, space } from '../theme/tokens';

interface ProcessingScreenProps {
  message?: string;
}

const DEFAULT_MESSAGE = '画像を解析しています…';

export function ProcessingScreen({ message = DEFAULT_MESSAGE }: ProcessingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={color.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  message: {
    fontSize: fontSize.body,
    color: color.textMuted,
  },
});
