import { useState } from 'react';
import { Alert, Image, Linking } from 'react-native';
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
import { detectSudokuCorners, expandCorners } from './src/ocr/detectCorners';
import { solve } from './src/solver';
import type { Corners, ImageSize } from './src/grid/types';
import type { Board } from './src/solver/types';

const MIN_HINTS = 17;
const MAX_RETRY = 3;
const EXPAND_RATIOS = [0, 0.05, 0.10];

type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview'; imageUri: string }
  | { name: 'cornerPicker'; imageUri: string; naturalSize: ImageSize; initialCorners: Corners | null }
  | { name: 'processing'; message?: string }
  | { name: 'review'; board: Board }
  | { name: 'result'; solvedBoard: Board; confirmedBoard: Board };

async function getImageSize(uri: string): Promise<ImageSize> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

function countHints(board: Board): number {
  return board.flat().filter((v) => v !== 0).length;
}

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

  /** preview → 自動検出 → cornerPicker */
  const handleProceedFromPreview = async (imageUri: string) => {
    setScreen({ name: 'processing', message: '盤面を検出しています…' });
    try {
      const naturalSize = await getImageSize(imageUri);
      const detected = await detectSudokuCorners(imageUri, naturalSize);
      setScreen({ name: 'cornerPicker', imageUri, naturalSize, initialCorners: detected });
    } catch {
      // 検出失敗時はデフォルトコーナーで cornerPicker を開く
      try {
        const naturalSize = await getImageSize(imageUri);
        setScreen({ name: 'cornerPicker', imageUri, naturalSize, initialCorners: null });
      } catch {
        Alert.alert('エラー', '画像を読み込めませんでした。');
        setScreen({ name: 'home' });
      }
    }
  };

  /** cornerPicker 確定 → OCR（ヒント不足時は拡張して最大 MAX_RETRY 回再試行） */
  const runOcrPipeline = async (
    imageUri: string,
    confirmedCorners: Corners,
    naturalSize: ImageSize
  ) => {
    try {
      for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
        // 各試行の先頭でメッセージを設定 → await 前に確実にレンダリングされる
        const segMsg =
          attempt === 0
            ? `セルに分割しています… (1/${MAX_RETRY})`
            : `再認識しています… (${attempt + 1}/${MAX_RETRY})`;
        setScreen({ name: 'processing', message: segMsg });

        const corners =
          attempt === 0
            ? confirmedCorners
            : expandCorners(confirmedCorners, naturalSize, EXPAND_RATIOS[attempt]);

        const cellImages = await segmentBoardFromCorners(imageUri, corners, naturalSize);
        setScreen({ name: 'processing', message: `数字を認識しています… (${attempt + 1}/${MAX_RETRY})` });
        const board = await recognizeBoard(cellImages);
        const hints = countHints(board);

        if (hints >= MIN_HINTS || attempt === MAX_RETRY - 1) {
          if (hints < MIN_HINTS) {
            Alert.alert(
              'ヒント数不足',
              `認識できた数字は ${hints} 個でした（目安: ${MIN_HINTS} 個以上）。\nコーナーを再調整して再試行してください。`,
              [{ text: 'OK' }]
            );
          }
          setScreen({ name: 'review', board });
          return;
        }
      }
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
          onPressPickPhoto={() => { void handlePickPhoto(); }}
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
          onProceed={() => { void handleProceedFromPreview(screen.imageUri); }}
          proceedLabel="次へ →"
        />
      )}
      {screen.name === 'cornerPicker' && (
        <CornerPickerScreen
          imageUri={screen.imageUri}
          initialCorners={screen.initialCorners ?? undefined}
          onCancel={() => setScreen({ name: 'preview', imageUri: screen.imageUri })}
          onConfirm={(corners, naturalSize) => {
            void runOcrPipeline(screen.imageUri, corners, naturalSize);
          }}
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
