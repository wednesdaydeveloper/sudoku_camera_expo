# Phase 3: カメラ／画像取得画面

## 目的

撮影またはライブラリ選択で画像を取得し、後続の盤面検出に渡す画面を実装する。Phase 2 のソルバと合わせて「手動入力で解ける」基本UXがこの段階で動き始める。

## 完了条件 (Definition of Done)

- [x] `src/screens/HomeScreen.tsx` 実装（案B: ヒーロー＋並列ボタン）
- [x] `src/screens/CameraScreen.tsx` 実装（自作シャッターUI＋権限フロー）
- [x] `src/screens/ImagePreviewScreen.tsx` 実装
- [x] カメラ権限要求／拒否時のフォールバックUI（CameraScreen 内インライン）
- [x] `expo-camera` で撮影
- [x] `expo-image-picker` でライブラリから選択
- [x] 撮影/選択後にプレビュー表示 → 「次へ」で Phase 4 仮メッセージ
- [x] `App.tsx` を書き換え、状態ベースの画面遷移を導入
- [x] `src/theme/tokens.ts` でデザイントークンを定義
- [x] `npx tsc --noEmit` グリーン
- [x] 既存テスト（Phase 2 のソルバ）に回帰なし
- [ ] iOS Simulator もしくは実機で起動確認（**ユーザー実施項目**）
- [ ] Gitコミット（日本語メッセージ）→ コミット直前に承認待ち
- [ ] Push（コミット後にユーザー承認）
- [ ] PR 作成（push 後にユーザー承認）

## 設計判断

### 画面構成

UI-DESIGN.md に従い、本Phaseで以下3画面を実装する:

| 画面ID | コンポーネント | 役割 |
|--------|--------------|------|
| Home | `HomeScreen` | 案B（ヒーロー＋下部並列ボタン）。撮影／写真選択の入口 |
| Camera | `CameraScreen` | `expo-camera` の `CameraView` を使った撮影画面 |
| ImagePreview | `ImagePreviewScreen` | 取得画像のプレビュー、撮り直す／次へ |

権限拒否画面（CameraDenied / PhotosDenied）は本Phaseでは **CameraScreen 内のインライン表示** で代用し、独立画面化は Phase 7 に持ち越す。

### 撮影UIは自作（Custom Overlay）

`CameraView` の上に自前の UI（戻る／シャッターボタン）をオーバーレイする。理由:
- ネイティブ標準UIは Expo にラップされない
- シャッターを大きくして親指リーチを最適化したい
- Phase 4 でガイド枠（盤面アスペクト 1:1）を重ねる予定なので、いずれにせよ自作になる

### 画面遷移は状態ベース

ADR-006 通り `expo-router` / `react-navigation` は使わず、`App.tsx` の `useState` で `screen` を切り替える。

```typescript
type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview'; imageUri: string };
```

### 「次へ」ボタンの遷移先

Phase 4 の CornerPicker が未実装のため、本Phaseでは **アラート表示**（「Phase 4 で実装予定です」）でとどめる。Phase 4 完了時に CornerPicker への遷移に置き換える。

### 縦持ち固定

`app.json` の `orientation: 'portrait'` を維持。横持ち対応は v1 範囲外。

### 写真選択（image picker）

`expo-image-picker` の `launchImageLibraryAsync` を使用。`mediaTypes: 'images'` で画像のみに制限。`allowsEditing: false`（ユーザーがクロップしてしまうと盤面検出に支障が出るため）。

### デザイントークン

`src/theme/tokens.ts` を新設し、UI-DESIGN.md 記載のカラー・サイズを定数化。ただし、Phase 3 で使うのは最低限（色4種・余白3種・タップ最小サイズ）に絞る。

### 動作確認方法

- `npx tsc --noEmit` で型チェック
- iOS Simulator で起動確認はユーザーに実機実行を依頼（Claude Code から GUI シミュレータ起動の保証なし）
- Web では expo-camera が動作しないため対象外

## 実装内容

### ファイル構成

```
App.tsx                        # 画面遷移ステート管理に書き換え
src/
├── theme/
│   └── tokens.ts              # デザイントークン（color/space/radius/fontSize/tap）
└── screens/
    ├── HomeScreen.tsx         # 案B: ヒーロー＋下部並列ボタン
    ├── CameraScreen.tsx       # 自作シャッターUI＋権限フロー
    └── ImagePreviewScreen.tsx # 取得画像のプレビュー＋撮り直す/次へ
```

### 画面遷移ステート

```typescript
// App.tsx
type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview'; imageUri: string };
```

### CameraScreen の権限フロー

```
permission === null            → ActivityIndicator（取得中）
permission.granted === false &&
  permission.canAskAgain        → 「許可する」ボタン → requestPermission()
permission.granted === false &&
  !permission.canAskAgain       → 「設定を開く」ボタン → Linking.openSettings()
permission.granted === true     → CameraView をフルスクリーン表示
```

### 撮影UI

- 上部: 戻る ✕ ボタン（半透明丸ボタン、44pt）
- 下部: 80pt のシャッターボタン（白丸＋外枠）
- `onCameraReady` コールバックで準備完了後にシャッター活性化
- 連打防止に `isTaking` フラグ

### 写真選択（HomeScreen → ImagePicker）

- `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false })`
- `result.canceled === false` のとき `assets[0].uri` を取得
- 取得失敗時は Alert で通知

### 「次へ」の暫定動作

`Alert.alert('Phase 4 で実装予定です', ...)` で停止。Phase 4 着手時に CornerPicker への遷移に置き換える。

## 動作確認

### 自動チェック（完了済）

| チェック | 結果 |
|---------|------|
| `npx tsc --noEmit` | エラーなし |
| `npm test` | 13/13 passed（ソルバの回帰なし） |

### ユーザー実施項目（未完了）

実機もしくはシミュレータでの起動確認は Claude Code から自動化できないため、ユーザーに実施を依頼する。

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

確認項目:
1. アプリ起動 → Home 画面が表示される
2. 「撮影」ボタン → カメラ権限プロンプト → 許可後に CameraView 表示
3. シャッター → ImagePreview 画面で撮影画像が表示される
4. 「撮り直す」→ Home に戻る
5. 「次へ」→ 「Phase 4 で実装予定です」アラート
6. Home 「選ぶ」→ 写真ライブラリピッカー → 画像選択 → ImagePreview 画面

実機テストでの所感はコミット後にユーザーから報告頂く前提で、Phase 7 の項目に追加する。

## 次Phaseへの引き継ぎ

- Phase 4 で CornerPicker を実装する際、`App.tsx` の `Screen` ユニオンに `{ name: 'cornerPicker'; imageUri: string }` を追加し、`ImagePreviewScreen` の `onProceed` を遷移ハンドラに差し替え
- Phase 4 では `expo-image-manipulator` を使って透視変換を実施
- 権限拒否時のUIは CameraScreen にインライン実装中。Phase 7 で独立画面化する際にはここから抽出
- `src/theme/tokens.ts` は今後の画面でも使い回すこと。新トークンが必要になったらここに追加
- `expo-status-bar` は現状 `style="auto"`。カメラ画面で黒背景になるので Phase 7 でカメラ時のみ `light` に切替検討

## ステータス

🟡 実装完了（型チェックOK・既存テスト回帰なし）。実機動作確認はユーザーレビュー後に Phase 7 へ反映予定。
