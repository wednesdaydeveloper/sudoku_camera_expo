import { useState } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ImagePreviewScreen } from './src/screens/ImagePreviewScreen';
import { CornerPickerScreen } from './src/screens/CornerPickerScreen';

type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview'; imageUri: string }
  | { name: 'cornerPicker'; imageUri: string }
  | { name: 'croppedPreview'; imageUri: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) {
      Alert.alert('画像を取得できませんでした', 'もう一度お試しください。');
      return;
    }
    setScreen({ name: 'preview', imageUri: uri });
  };

  const handleProceedToOcr = () => {
    Alert.alert(
      'Phase 5 で実装予定です',
      'セル分割と数字認識（OCR）を実行し、レビュー画面に進みます。'
    );
  };

  return (
    <>
      <StatusBar style="auto" />
      {screen.name === 'home' && (
        <HomeScreen
          onPressCapture={() => setScreen({ name: 'camera' })}
          onPressPickPhoto={() => {
            void handlePickPhoto();
          }}
        />
      )}
      {screen.name === 'camera' && (
        <CameraScreen
          onCapture={(imageUri) => setScreen({ name: 'preview', imageUri })}
          onCancel={() => setScreen({ name: 'home' })}
        />
      )}
      {screen.name === 'preview' && (
        <ImagePreviewScreen
          imageUri={screen.imageUri}
          onRetry={() => setScreen({ name: 'home' })}
          onProceed={() =>
            setScreen({ name: 'cornerPicker', imageUri: screen.imageUri })
          }
        />
      )}
      {screen.name === 'cornerPicker' && (
        <CornerPickerScreen
          imageUri={screen.imageUri}
          onCancel={() =>
            setScreen({ name: 'preview', imageUri: screen.imageUri })
          }
          onCropped={(result) =>
            setScreen({ name: 'croppedPreview', imageUri: result.uri })
          }
        />
      )}
      {screen.name === 'croppedPreview' && (
        <ImagePreviewScreen
          imageUri={screen.imageUri}
          onRetry={() => setScreen({ name: 'home' })}
          onProceed={handleProceedToOcr}
          note="補正後の盤面です。OCR で数字を読み取ります。"
          retryLabel="やり直す"
          proceedLabel="OCR を実行 →"
        />
      )}
    </>
  );
}
