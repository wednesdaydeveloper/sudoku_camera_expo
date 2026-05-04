# sudoku-camera-expo

スマホカメラで数独問題を撮影し、OCRで盤面を読み取って自動で解くiOS/Androidアプリ。

## 機能

- カメラで数独を撮影、または写真ライブラリから画像を選択
- 4隅をドラッグして盤面の範囲を指定
- ML Kit によるオンデバイスOCRで数字を自動認識
- 認識結果をタップ編集してから解く
- ヒント（黒）と解答（青）を色分けして表示

## スクリーンショット

| ホーム | 4隅指定 | OCR確認 | 解答 |
|--------|---------|---------|------|
| ![home](docs/screenshots/home.png) | ![corner](docs/screenshots/corner.png) | ![review](docs/screenshots/review.png) | ![result](docs/screenshots/result.png) |

## 必要環境

| ツール | バージョン |
|--------|-----------|
| Node.js | 18以上 |
| Expo CLI | SDK 54 |
| Xcode | 15以上（iOS実機/Simulator） |
| Android Studio | 最新推奨（Android実機/Emulator） |
| CocoaPods | 1.14以上 |

> **注意**: このアプリは ML Kit ネイティブモジュールを使用しているため、**Expo Go では動作しません**。Development Build が必要です。

## セットアップ

```bash
# 依存インストール
npm install

# iOS用ネイティブビルド（初回のみ）
npx expo prebuild --platform ios
npx expo run:ios

# Android用
npx expo prebuild --platform android
npx expo run:android
```

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `npm start` | Metro バンドラ起動 |
| `npm run ios` | iOS Simulator で起動 |
| `npm run android` | Android Emulator で起動 |
| `npm test` | Jest ユニットテスト実行 |
| `npx tsc --noEmit` | 型チェック |

## 使い方

1. **撮影または選択** — ホーム画面から「カメラで撮影」または「写真を選ぶ」
2. **プレビュー確認** — 撮影した画像を確認し「次へ」
3. **盤面の4隅を指定** — ドラッグハンドルで数独の4隅に合わせて「確定」
4. **OCR結果を確認** — 誤認識があればセルをタップして修正し「解く」
5. **解答を確認** — 黒字がヒント、青字がソルバが埋めた数字

## アーキテクチャ

```
撮影/選択 → 4隅指定 → セル分割（双線形補間） → OCR → 手動修正 → ソルバ → 解答表示
```

- **ソルバ**: MRVヒューリスティック + ビットマスクによるバックトラック（外部依存なし）
- **セル分割**: 4隅から双線形補間で各セルの座標を算出、透視歪みに対応
- **OCR**: `@react-native-ml-kit/text-recognition` でオンデバイス推論
- **ナビゲーション**: `useState` による状態ベースの画面遷移（React Navigation 不使用）

## 技術スタック

| 領域 | ライブラリ |
|------|-----------|
| フレームワーク | Expo SDK 54 / React Native 0.81 / React 19 |
| 言語 | TypeScript 5.9（strict） |
| 撮影 | expo-camera |
| 画像選択 | expo-image-picker |
| 画像変換 | expo-image-manipulator |
| OCR | @react-native-ml-kit/text-recognition |
| テスト | Jest + jest-expo |

## ライセンス

MIT
