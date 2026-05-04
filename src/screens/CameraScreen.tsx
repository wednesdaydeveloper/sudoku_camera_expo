import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { color, fontSize, radius, space, tap } from '../theme/tokens';

interface CameraScreenProps {
  onCapture: (imageUri: string) => void;
  onCancel: () => void;
}

export function CameraScreen({ onCapture, onCancel }: CameraScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTaking, setIsTaking] = useState(false);

  if (!permission) {
    return (
      <SafeAreaView style={styles.deniedContainer}>
        <ActivityIndicator color={color.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.deniedContainer}>
        <View style={styles.deniedContent}>
          <Text style={styles.deniedTitle}>カメラへのアクセスが必要です</Text>
          <Text style={styles.deniedBody}>
            数独の問題を撮影するには、設定からカメラの利用を許可してください。
          </Text>
          {permission.canAskAgain ? (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => {
                void requestPermission();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>許可する</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => {
                void Linking.openSettings();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>設定を開く</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={onCancel}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>戻る</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || !isReady || isTaking) return;
    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: false,
      });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } finally {
      setIsTaking(false);
    }
  };

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setIsReady(true)}
      />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="戻る"
          >
            <Text style={styles.iconButtonLabel}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [
              styles.shutter,
              (!isReady || isTaking) && styles.shutterDisabled,
              pressed && styles.shutterPressed,
            ]}
            onPress={() => {
              void handleCapture();
            }}
            disabled={!isReady || isTaking}
            accessibilityRole="button"
            accessibilityLabel="撮影"
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: color.black,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    alignItems: 'flex-start',
  },
  iconButton: {
    width: tap.minSize,
    height: tap.minSize,
    borderRadius: tap.minSize / 2,
    backgroundColor: color.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonLabel: {
    color: color.white,
    fontSize: 18,
  },
  bottomBar: {
    paddingBottom: space.xl,
    alignItems: 'center',
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.white,
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterPressed: {
    opacity: 0.7,
  },
  deniedContainer: {
    flex: 1,
    backgroundColor: color.bg,
  },
  deniedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  deniedTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: color.text,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  deniedBody: {
    fontSize: fontSize.body,
    color: color.textMuted,
    textAlign: 'center',
    marginBottom: space.lg,
  },
  primaryButton: {
    backgroundColor: color.primary,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    marginBottom: space.sm,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: color.white,
    fontSize: fontSize.button,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minWidth: 220,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: color.primary,
    fontSize: fontSize.button,
  },
  pressed: {
    opacity: 0.8,
  },
});
