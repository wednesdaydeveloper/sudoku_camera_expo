# Phase 5: セル分割＋数字OCR

## 目的

補正後の正方形画像を9×9に分割し、各セルから数字を認識する。空欄判定も含める。

## 完了条件 (Definition of Done)

- [x] OCRエンジン選定: `@react-native-ml-kit/text-recognition`
- [x] CocoaPods を Homebrew で導入
- [x] `expo-dev-client` を導入
- [x] `src/ocr/types.ts`: CellImageGrid / CellRect / SegmentOptions 型
- [x] `src/ocr/segment.ts`: 補正画像を 9×9 にスライス（`computeCellRect` + `segmentBoard`）
- [x] `src/ocr/recognize.ts`: ML Kit 経由で各セル → `Cell` 型（`parseDigitFromText` + `recognizeBoard`）
- [x] `src/ocr/index.ts`: バレル
- [x] `src/grid/cropToBoundingRect.ts`: 新 API（`ImageManipulator.manipulate(...).crop(...).renderAsync().saveAsync(...)`）に書き換え
- [x] `src/screens/ProcessingScreen.tsx`: スピナー付き解析中画面
- [x] `src/screens/ReviewScreen.tsx`: OCR 結果を 9×9 表示する仮 Review 画面
- [x] App.tsx に processing / review 遷移、`runOcrPipeline` を追加
- [x] `__tests__/ocr.test.ts`: `computeCellRect` / `parseDigitFromText` を 13 ケース検証
- [x] `npx tsc --noEmit` グリーン
- [x] `npm test` 29/29 グリーン
- [x] `npx expo prebuild` で ios/ 生成 + pod install 完了
- [x] iOS Simulator で OCR パイプラインの動作確認（end-to-end でホーム→撮影/選択→補正→OCR→Review まで遷移する）
- [x] サンプル画像での OCR 精度評価（IMG_1509 / IMG_1510 で実施 → 精度に課題あり、Phase 7 へ持ち越し）

## 設計判断

### OCRエンジン: `@react-native-ml-kit/text-recognition`

ADR-005 に従い端末内 OCR を採用。具体ライブラリは Google ML Kit の React Native ラッパーである `@react-native-ml-kit/text-recognition` を使う。

- **長所**: iOS/Android両対応、印字数字の認識精度が高い、無料、Google が継続メンテ
- **短所**: ネイティブモジュール → **Development Build 必須**（Expo Go 不可）

### Development Build はローカルビルド

ユーザーの Mac に Xcode 26.4 + iOS Simulator が利用可能なため、ローカルビルド方式を採用。

```bash
npx expo install expo-dev-client
npx expo install @react-native-ml-kit/text-recognition
npx expo install expo-build-properties
npx expo prebuild --platform ios --clean
npx expo run:ios
```

CocoaPods は本Phase 着手時に Homebrew で導入。

### iOS deployment target を 15.5 に引き上げ

`@react-native-ml-kit/text-recognition` が iOS 15.5 以上を要求する（Expo SDK 54 デフォルトは 15.1）。`expo-build-properties` で設定する:

```jsonc
// app.json
"plugins": [
  [
    "expo-build-properties",
    { "ios": { "deploymentTarget": "15.5" } }
  ]
]
```

### セル前処理: 最小限

ML Kit Text Recognition は印刷数字の認識精度が高いため、初期実装では **二値化やモルフォロジー処理を行わない**。OCR 精度評価後に必要なら追加検討する。

### 信頼度しきい値・空欄判定

- 各セル画像を ML Kit に投入
- 認識結果がない／信頼度が低い → 空欄（`0`）
- 数字以外の文字（記号や英字）が返ってきた → 空欄扱いし、ユーザー修正に委ねる
- ML Kit の `confidence` プロパティを参照し、しきい値（暫定 0.5）以下は空欄

### セル分割（Segmentation）

`src/ocr/segment.ts` にて、補正画像を 9×9 にスライス。各セルを個別の JPEG として書き出し、URI を返す。

```typescript
// 想定 API
async function segmentBoard(croppedUri: string): Promise<CellImages>
type CellImages = string[][];  // 9x9 の URI 配列
```

- `expo-image-manipulator` の `crop` を 81 回呼び出す
- セル境界からわずかに内側を取る（罫線を避けるため、各セル 5% インセット）
- 出力解像度は ML Kit に合わせ 100×100 程度（要評価）

### 進捗表示

OCR 81 回は数秒かかる可能性があるため、`ProcessingScreen` を追加。
- 「画像を解析しています…」のスピナー表示
- 完了したら `Review` 画面（仮）へ遷移

### 仮 Review 画面

Phase 6 で本格実装する予定だが、Phase 5 完了の動作確認のため最小限の Review 画面を作る。
- OCR 結果を 9×9 グリッドで表示（読み取り専用）
- 「ホームへ戻る」ボタン
- セルタップによる修正は Phase 6

### 画面遷移の更新

```typescript
type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview'; imageUri: string }
  | { name: 'cornerPicker'; imageUri: string }
  | { name: 'croppedPreview'; imageUri: string }
  | { name: 'processing'; imageUri: string }   // 追加
  | { name: 'review'; board: Board };           // 追加
```

`croppedPreview` の「OCR を実行」→ `processing` → OCR 完了で `review` へ遷移。

### テスト

- `segment.ts` の純粋ロジック（インセット計算、座標算出）は単体テスト可能
- OCR 部分はネイティブモジュールに依存するため Jest では実行不可。手動検証で代用

## 実装内容

### モジュール構成

| ファイル | 役割 |
|---|---|
| `src/ocr/types.ts` | `CellImageGrid` / `CellRect` / `SegmentOptions` |
| `src/ocr/segment.ts` | `computeCellRect`（純関数）+ `segmentBoard`（81 セルを並列クロップ）|
| `src/ocr/recognize.ts` | `parseDigitFromText`（純関数）+ `recognizeBoard`（並列認識）|
| `src/ocr/index.ts` | バレル |
| `src/screens/ProcessingScreen.tsx` | スピナー + メッセージ |
| `src/screens/ReviewScreen.tsx` | 9×9 読み取り専用表示（編集は Phase 6）|
| `App.tsx` | `processing` / `review` 状態遷移と `runOcrPipeline` |

### パイプライン

`croppedPreview` で「OCR を実行」 → `runOcrPipeline(uri, imageSize)` → `processing`（メッセージ更新あり）→ `segmentBoard` で 81 枚生成 → `recognizeBoard` で並列 OCR → `review` 画面で 9×9 表示。

### 依存追加

- `@react-native-ml-kit/text-recognition` — ML Kit Text Recognition の RN ラッパー
- `expo-dev-client` — Expo Dev Client（Expo Go では動かなくなったため）
- `expo-build-properties` — iOS deployment target を 15.5 に引き上げ

### `cropToBoundingRect` の API 移行

`expo-image-manipulator` の旧 `manipulateAsync` がエラーを出すようになったため、新しい builder 形式（`ImageManipulator.manipulate(uri).crop(rect).renderAsync().saveAsync(...)`）に書き換え。`segmentBoard` も同形式に統一。

## 動作確認

### 単体テスト

`npm test` 全 29/29 グリーン。
- `computeCellRect` 6 ケース（境界・インセット・範囲外）
- `parseDigitFromText` 6 ケース（単数字・空文字・先頭抽出・記号のみ・複数桁）

### iOS Simulator（手動）

iPhone Simulator で end-to-end の遷移を確認:

1. ホーム → 「写真ライブラリから選ぶ」 → サンプル数独画像を選択 (IMG_1509 系)
2. プレビュー → 「次へ進む」 → コーナーピッカーで 4 隅を手動指定 → 「クロップ」
3. 補正後プレビュー → 「OCR を実行」 → ProcessingScreen でメッセージ更新
4. ReviewScreen に OCR 結果が 9×9 表示される

遷移、スピナー、エラー時 Alert は期待通り動作。**OCR 精度には大きな課題あり** ↓ 参照。

### OCR 精度評価（IMG_1509 → IMG_1510）

入力（補正後画像）は 25 セルが埋まっている問題。OCR 結果は **約 10 セルしか読めず、しかも全行が +1 行ずれて出力された**。

| 入力(r,c) | 値 | OCR 出力 | 状態 |
|---|---|---|---|
| (0,7) | 6 | (1,7) | 行+1 |
| (1,3) | 4 | (2,3) | 行+1 |
| (1,7) | 9 | (2,7) | 行+1 |
| (1,8) | 7 | (2,8) | 行+1 |
| (2,1) | 2 | (3,1) | 行+1 |
| (2,3) | 8 | (3,3) | 行+1 |
| (2,6) | 4 | (3,6) | 行+1 |
| (3,1) | 5 | (4,1) | 行+1 |
| (3,8) | 3 | (4,7) | 行+1 列-1 |
| (4,1) | 8 | (5,1) | 行+1 |
| (4,3) | 7 | (5,3) | 行+1 |
| 入力行5以降の数字 (約10個) | — | — | ほぼ全滅 |

### 不正の根本原因

1. **透視変換の欠如（最大要因）** — `cropToBoundingRect` は axis-aligned bounding rect で切り抜くだけで、4 点の射影変換を行っていない。原画像が少しでも斜めだと、補正後画像の格子は微妙に台形となり、9 等分の segmentation 線と実際の罫線がズレる。下に行くほど累積し、行 5 以降は数字がセル境界をまたいで認識失敗。
2. **ML Kit Text Recognition の単一文字認識弱さ** — ML Kit は単語/段落向けで、孤立した 1 文字は検出を返さないことが多い。
3. **罫線の混入** — インセット 10% でも、原因 1 のズレと組み合わさると太い 3×3 ボックス境界線がセル内に侵入し ML Kit を混乱させる。

詳細は ADR-008（透視変換の Phase 7 持ち越し）参照。

## 次Phaseへの引き継ぎ

### Phase 6 への引き継ぎ

- ReviewScreen は読み取り専用で実装済み。Phase 6 でセルタップ → 数字選択ピッカー、解く実行ボタン、ResultScreen を追加。
- OCR 精度が低い前提でも、誤読を簡単に修正できる UI が UX 上の生命線。
- `Board` 型は `Cell = 0|1|2|...|9`、`0` は空欄。`recognizeBoard` 失敗セルもこれに揃えた。

### Phase 7 への引き継ぎ（精度改善）

優先順:
1. **透視変換の導入** — `react-native-perspective-image-cropper` 等のライブラリ調査、もしくは自前で 3×3 行列計算（`expo-image-manipulator` には射影変換がないため別ライブラリ必須）
2. **盤面検出の自動化** — 輪郭抽出で外周 4 点を自動取得（手動 4 点指定の精度限界を超える）
3. **セル前処理** — グレースケール化／二値化（Otsu）／コントラスト強調
4. **ML Kit confidence の活用** — 現状 `result.text` しか見ていない。`result.blocks[].lines[].elements[].confidence` でしきい値フィルタ
5. **代替 OCR の検証** — Apple Vision Framework は単一数字に強い（iOS のみ）
6. **セル単位の信頼度を Review 画面で可視化** — 低信頼度セルを赤で強調 → 修正候補を絞り込みやすくする

## ステータス

✅ 完了（OCR 精度改善は Phase 7 に持ち越し）
