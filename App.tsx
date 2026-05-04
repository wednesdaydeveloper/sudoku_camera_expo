import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ImagePreviewScreen } from './src/screens/ImagePreviewScreen';
import { CornerPickerScreen } from './src/screens/CornerPickerScreen';
import { ProcessingScreen } from './src/screens/ProcessingScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { segmentBoardFromCorners } from './src/ocr/segment';
import { recognizeBoard } from './src/ocr/recognize';
import { solve } from './src/solver';
import type { Corners, ImageSize } from './src/grid/types';
import type { Board } from './src/solver/types';

type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview'; imageUri: string }
  | { name: 'cornerPicker'; imageUri: string }
  | { name: 'croppedPreview'; imageUri: string; imageSize: ImageSize; originalImageUri: string; corners: Corners; naturalSize: ImageSize }
  | { name: 'processing'; message?: string }
  | { name: 'review'; board: Board }
  | { name: 'result'; solvedBoard: Board; confirmedBoard: Board };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  const handlePickPhoto = async () => {
    const { granted, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!granted) {
      if (canAskAgain) {
        const { granted: newGranted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!newGranted) {
          Alert.alert('アクセスが必要です', '写真ライブラリを利用するには設定から許可してください。');
          return;
        }
      } else {
        Alert.alert(
          'アクセスが必要です',
          '写真ライブラリを利用するには設定から許可してください。',
          [
            { text: '設定を開く', onPress: () => void Linking.openSettings() },
            { text: 'キャンセル', style: 'cancel' },
          ]
        );
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) {
      Alert.alert('画像を取得できませんでした', 'もう一度お試しください。');
      return;
    }
    setScreen({ name: 'preview', imageUri: asset.uri });
  };

  const handleSolve = (editedBoard: Board) => {
    const result = solve(editedBoard);
    if (result.status === 'solved') {
      setScreen({ name: 'result', solvedBoard: result.board, confirmedBoard: editedBoard });
    } else if (result.status === 'invalid') {
      Alert.alert('入力エラー', result.reason + '\nセルを修正してください。');
    } else {
      Alert.alert('解けません', 'この問題は解が存在しないか、入力に誤りがあります。');
    }
  };

  const runOcrPipeline = async (
    originalImageUri: string,
    corners: Corners,
    naturalSize: ImageSize
  ) => {
    setScreen({ name: 'processing', message: 'セルに分割しています…' });
    try {
      const cellImages = await segmentBoardFromCorners(originalImageUri, corners, naturalSize);
      setScreen({ name: 'processing', message: '数字を認識しています…' });
      const board = await recognizeBoard(cellImages);
      setScreen({ name: 'review', board });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '画像の解析に失敗しました';
      Alert.alert('エラー', message);
      setScreen({ name: 'home' });
    }
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
          onCropped={(result, corners, naturalSize) =>
            setScreen({
              name: 'croppedPreview',
              imageUri: result.uri,
              imageSize: { width: result.width, height: result.height },
              originalImageUri: screen.imageUri,
              corners,
              naturalSize,
            })
          }
        />
      )}
      {screen.name === 'croppedPreview' && (
        <ImagePreviewScreen
          imageUri={screen.imageUri}
          onRetry={() => setScreen({ name: 'home' })}
          onProceed={() => {
            void runOcrPipeline(screen.originalImageUri, screen.corners, screen.naturalSize);
          }}
          note="補正後の盤面です。OCR で数字を読み取ります。"
          retryLabel="やり直す"
          proceedLabel="OCR を実行 →"
        />
      )}
      {screen.name === 'processing' && (
        <ProcessingScreen message={screen.message} />
      )}
      {screen.name === 'review' && (
        <ReviewScreen
          board={screen.board}
          onSolve={handleSolve}
          onBack={() => setScreen({ name: 'home' })}
        />
      )}
      {screen.name === 'result' && (
        <ResultScreen
          solvedBoard={screen.solvedBoard}
          confirmedBoard={screen.confirmedBoard}
          onRetry={() => setScreen({ name: 'home' })}
        />
      )}
    </>
  );
}
