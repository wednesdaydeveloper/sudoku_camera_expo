# Phase 4: 盤面検出（手動4点指定）

## 目的

撮影画像から数独盤面の領域を抽出し、正方形に補正する。MVP では自動検出を採用せず、ユーザーが4隅をタップして指定する方式で実装する（ADR-004）。

## 完了条件 (Definition of Done)

- [x] `src/screens/CornerPickerScreen.tsx`: 画像上で4ハンドルをドラッグ可能なUI
- [x] 初期位置は画像内側10%のインセット
- [x] ハンドル位置を画像natural座標へ scale 変換
- [x] `src/grid/cropToBoundingRect.ts`: 4隅 → bounding rect 変換 + `expo-image-manipulator` クロップ
- [x] `src/grid/types.ts`: Point / Corners / ImageSize / BoundingRect 型
- [x] `__tests__/grid.test.ts`: `computeBoundingRect` の純粋ロジックを4ケースで検証
- [x] `ImagePreviewScreen` を再利用して補正後プレビューを表示
- [x] App.tsx に `cornerPicker` / `croppedPreview` の遷移を追加
- [x] `npx tsc --noEmit` グリーン
- [x] `npm test` グリーン（17/17）
- [ ] 実機 or シミュレータで動作確認 ← **ユーザー実施項目**
- [ ] Gitコミット（日本語メッセージ）→ コミット直前に承認待ち
- [ ] Push（コミット後にユーザー承認）
- [ ] PR 作成（push 後にユーザー承認）

## 設計判断

### 補正方式: bounding rect クロップ（案1）

`expo-image-manipulator` は矩形クロップしか提供しないため、4隅から **軸並行な bounding rect** を算出してクロップする。真の透視変換は v1.1 以降で `@shopify/react-native-skia` 等を使ってアップグレード予定。

- **長所**: 既存依存のみで完結、Dev Build 不要、実装が単純
- **短所**: 撮影角度が傾いていると盤面が台形に残る → セルが歪む。印刷物を真上から平らに撮る前提なら許容範囲
- **既知の制約**: 強い傾きで OCR 精度低下。Phase 5 完了後に実機評価して必要なら案2にアップグレード

### CornerPicker UI: 4ハンドル（案2a）

UI-DESIGN.md 通り 4 つのドラッグ可能ハンドルを配置。理由:
- 後で透視変換にアップグレードしても UI を作り直さず済む
- ユーザーに「盤面の4隅を指定する」というメンタルモデルを早期に植え付けられる

### ジェスチャは PanResponder

`react-native-gesture-handler` を導入せず、RN 標準の `PanResponder` を使用。理由:
- 4 つの単一ハンドルを独立にドラッグするだけなので機能的に十分
- 新規依存不要
- Phase 6 で複雑なジェスチャが必要になったら導入を再評価

### 状態管理は useState

`react-native-reanimated` の SharedValue を使うとドラッグ中の再レンダ負荷を下げられるが、ハンドル4個＋線4本の単純構造ならuseStateで十分滑らか。MVP 範囲ではシンプルさを優先。

### 画像表示はネイティブサイズ→ contain にフィット

- `Image.getSize()` で natural size を取得
- 親 View のサイズを `onLayout` で取得
- 自前で contain 計算（`computeContainLayout`）して画像を描画
- ハンドル座標は **画面表示座標**（display coords）で持つ
- クロップ実行時に display coords → image natural coords へ scale 変換

### 画面遷移の追加

```typescript
type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview'; imageUri: string }
  | { name: 'cornerPicker'; imageUri: string }      // 追加
  | { name: 'croppedPreview'; imageUri: string };   // 追加（Phase 5 までのつなぎ）
```

`ImagePreviewScreen` の「次へ」を `cornerPicker` 遷移に差し替え。`cornerPicker` 確定 → クロップ → `croppedPreview`。`croppedPreview` の「次へ」は Phase 5 実装予定アラート。

### `croppedPreview` 画面は ImagePreviewScreen の再利用

専用画面を作らず、`ImagePreviewScreen` に optional props（`note`, `retryLabel`, `proceedLabel`）を追加して再利用。重複コードを避ける。

### テスト

UI コンポーネントは jest-expo + react-test-renderer 不在のため割愛。`computeBoundingRect`（pure math）のみ単体テストする。

## 実装内容

### ファイル構成

```
src/
├── grid/
│   ├── types.ts                # Point / Corners / ImageSize / BoundingRect
│   └── cropToBoundingRect.ts   # computeBoundingRect (pure) + cropToBoundingRect (async)
├── screens/
│   ├── CornerPickerScreen.tsx  # 4ハンドル UI
│   └── ImagePreviewScreen.tsx  # optional props 追加で再利用
└── App.tsx                     # cornerPicker / croppedPreview 遷移を追加

__tests__/
└── grid.test.ts                # computeBoundingRect 4ケース
```

### 主要ロジック

**`computeBoundingRect(corners, imageSize)`** (pure):
- 4隅から min/max を取り、画像サイズに clamp、整数化
- `{ originX, originY, width, height }` を返す

**`cropToBoundingRect(uri, corners, imageSize)`** (async):
- `computeBoundingRect` を呼び、`manipulateAsync` で JPEG 出力
- width/height がゼロ以下なら例外

**`CornerPickerScreen`**:
- `Image.getSize` で natural サイズ取得
- 親 View の `onLayout` でコンテナサイズ取得
- 自前で contain レイアウト計算（`computeContainLayout`）
- 表示座標で4ハンドルを管理、確定時に scale 変換して画像座標へ
- ハンドルは PanResponder ベース、ヒットエリア 44pt / 視覚 24pt
- 4辺の線は absolute View + transform rotate で描画

**`ImagePreviewScreen` 拡張**:
- optional props `note`, `retryLabel`, `proceedLabel` を追加
- 既存の preview 用途は無変更（デフォルト値で同じ）
- `croppedPreview` は同コンポーネントを別文言で再利用

### 画面遷移

```
home → camera/picker → preview → 次へ → cornerPicker
                                            ↓
                                          確定
                                            ↓
                                    （bounding rect crop）
                                            ↓
                                       croppedPreview → OCR を実行 → Phase 5 alert
```

## 動作確認

### 自動チェック（完了済）

| チェック | 結果 |
|---------|------|
| `npx tsc --noEmit` | エラーなし |
| `npm test` | 17/17 passed（grid 4 + solver 13） |

### `computeBoundingRect` のテストケース

1. 軸並行な4隅 → 期待する rect
2. 歪んだ4隅 → 外接矩形
3. 画像外にはみ出た座標 → 画像サイズに clamp
4. 小数座標 → floor / ceil で整数化

### ユーザー実施項目（未完了）

シミュレータ／実機で以下を確認:

```bash
npm run ios
# または
npm run android
```

確認項目:
1. Home → 撮影/選択 → ImagePreview → 次へ
2. CornerPicker 画面で画像と4ハンドルが表示される
3. 各ハンドルがドラッグで移動でき、4辺の線が追従する
4. ハンドルは画像範囲外に出ない
5. 「確定」→ 補正画像が `croppedPreview` に表示される
6. 「OCR を実行」で Phase 5 アラート表示

## 次Phaseへの引き継ぎ

- **OCR 入力**: `croppedPreview` 段階で得られる画像URI（軸並行な矩形クロップ）を Phase 5 のセル分割に渡す
- **解像度**: クロップ後画像のサイズは元画像依存。ML Kit が求める解像度に応じて Phase 5 で `resize` を入れるかも
- **既知の制約**: 強い傾きがある撮影画像では盤面が台形のまま残る → セルが歪む。Phase 5 の OCR 精度評価後、必要なら ADR-005 を見直して透視変換にアップグレード
- **CornerPicker のUX**:
  - 拡大ルーペは未実装（UI-DESIGN.md 案A の "ハンドル＋拡大ルーペ" のうちルーペ部分は v1.1）
  - ハンドル誤タップ防止は ヒット領域 44pt のみで対応中。十分か実機評価
- **`croppedPreview`**: 専用画面を作らず `ImagePreviewScreen` を再利用。Phase 6 で Review 画面が独立した時点で `croppedPreview` 状態は廃止予定

## ステータス

🟡 実装完了（型チェックOK・テスト17件グリーン）。実機動作確認はユーザーレビュー後に Phase 7 へ反映予定。
