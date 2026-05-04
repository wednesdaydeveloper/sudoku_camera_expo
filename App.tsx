import { useState } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ImagePreviewScreen } from './src/screens/ImagePreviewScreen';

type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview'; imageUri: string };

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

  const handleProceed = () => {
    Alert.alert('Phase 4 で実装予定です', '次の画面で盤面の4隅を指定して画像を補正します。');
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
          onProceed={handleProceed}
        />
      )}
    </>
  );
}
