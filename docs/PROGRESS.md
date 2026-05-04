# 開発進捗

最終更新: 2026-05-04（Phase 7 進行中）

## サマリ

| Phase | 内容 | ステータス | 詳細 |
|-------|------|-----------|------|
| 1 | プロジェクト基盤 | ✅ 完了 | [phase-1-setup.md](phases/phase-1-setup.md) |
| 2 | 数独ソルバ（純ロジック） | ✅ 完了 | [phase-2-solver.md](phases/phase-2-solver.md) |
| 3 | カメラ／画像取得画面 | ✅ 完了 | [phase-3-camera.md](phases/phase-3-camera.md) |
| 4 | 盤面検出（手動4点指定） | ✅ 完了 | [phase-4-grid-detect.md](phases/phase-4-grid-detect.md) |
| 5 | セル分割＋数字OCR | ✅ 完了（精度改善は Phase 7） | [phase-5-ocr.md](phases/phase-5-ocr.md) |
| 6 | 結果画面と手動修正UI | ✅ 完了 | [phase-6-result-ui.md](phases/phase-6-result-ui.md) |
| 7 | エラーハンドリング・実機テスト | 🟡 進行中 | [phase-7-polish.md](phases/phase-7-polish.md) |

凡例: ✅ 完了 / 🟡 進行中 / ⚪ 未着手 / ⛔ 中断

## 横断ドキュメント

- [ARCHITECTURE.md](ARCHITECTURE.md) — システム全体図とモジュール責務
- [UI-DESIGN.md](UI-DESIGN.md) — 画面遷移図・レイアウト案・デザイントークン
- [DECISIONS.md](DECISIONS.md) — ADRログ

## Phase 1: プロジェクト基盤 ✅

- [x] Expo SDK 54 + TypeScript スケルトン生成
- [x] expo-camera / expo-image-picker / expo-image-manipulator 導入
- [x] Jest + jest-expo 導入
- [x] app.json にカメラ・写真ライブラリ権限プラグイン設定
- [x] package.json に test スクリプトと jest preset 設定
- [x] `npx tsc --noEmit` グリーン
- [x] Gitコミット（`f8bf2a1`）

## Phase 2: 数独ソルバ ✅

- [x] `src/solver/types.ts`: Board / Cell / SolveResult 型定義
- [x] `src/solver/validate.ts`: 入力盤面の妥当性検証
- [x] `src/solver/solve.ts`: MRV ヒューリスティック + ビットマスクのバックトラック
- [x] `__tests__/solver.test.ts`: easy / medium / hard / 完成済み / 空 / unsolvable / invalid（13ケース）
- [x] 解けない問題に対する `invalid` / `unsolvable` 戻り値
- [x] `npm test` グリーン
- [x] Gitコミット

## Phase 3: カメラ／画像取得画面 🟡

- [x] `src/screens/HomeScreen.tsx` 実装（案B レイアウト）
- [x] `src/screens/CameraScreen.tsx` 実装
- [x] `src/screens/ImagePreviewScreen.tsx` 実装
- [x] `src/theme/tokens.ts` でデザイントークン定義
- [x] パーミッション要求 + 拒否時UI（CameraScreen にインライン）
- [x] expo-camera で撮影 / expo-image-picker でライブラリ選択
- [x] App.tsx の状態ベース画面遷移を組み込み
- [x] `npx tsc --noEmit` グリーン / 既存テスト 13件グリーン
- [ ] 実機 or シミュレータで動作確認 ← **ユーザー実施項目**
- [ ] Gitコミット ← 承認待ち
- [ ] Push ← 承認待ち
- [ ] PR 作成 ← 承認待ち

## Phase 4: 盤面検出（手動4点指定） 🟡

- [x] `src/grid/types.ts`: Point / Corners / ImageSize / BoundingRect 型
- [x] `src/grid/cropToBoundingRect.ts`: bounding rect 計算 + クロップ実行
- [x] `src/screens/CornerPickerScreen.tsx`: 4ハンドル UI（PanResponder）
- [x] `ImagePreviewScreen` を optional props 化して再利用
- [x] App.tsx に cornerPicker / croppedPreview 遷移を追加
- [x] `__tests__/grid.test.ts` 4ケース通過（合計17件）
- [x] `npx tsc --noEmit` グリーン
- [ ] 実機 or シミュレータで動作確認 ← **ユーザー実施項目**
- [ ] Gitコミット ← 承認待ち
- [ ] Push ← 承認待ち
- [ ] PR 作成 ← 承認待ち

## Phase 5: セル分割＋数字OCR ✅

- [x] OCR エンジン選定: `@react-native-ml-kit/text-recognition`
- [x] CocoaPods を Homebrew で導入
- [x] `expo-dev-client` 導入
- [x] `src/ocr/segment.ts` (`computeCellRect` + `segmentBoard`)
- [x] `src/ocr/recognize.ts` (`parseDigitFromText` + `recognizeBoard`)
- [x] `src/screens/ProcessingScreen.tsx` / `src/screens/ReviewScreen.tsx`
- [x] App.tsx に processing / review 遷移と OCR パイプライン
- [x] cropToBoundingRect.ts を新 API へ移行
- [x] `__tests__/ocr.test.ts` 13 ケース通過（合計 29/29）
- [x] `npx tsc --noEmit` グリーン
- [x] `npx expo prebuild --platform ios` 完了 / `npx expo run:ios` で iOS Simulator 起動確認
- [x] サンプル画像で OCR 精度評価（IMG_1509 → IMG_1510）。透視変換欠如により行ズレ発生 → ADR-008 で Phase 7 へ持ち越し

## Phase 6: 結果画面と手動修正UI ✅

- [x] `src/screens/ReviewScreen.tsx`: セルタップ編集（ボトムオーバーレイ数字ピッカー）＋「解く」ボタン
- [x] `src/screens/ResultScreen.tsx`: ソルバ実行 → 解答表示（ヒント数字は黒、解答は青）
- [x] エラー（解けない／入力不正）のフィードバック Alert
- [x] iOS Simulator 動作確認 OK
- [x] Gitコミット（`55a406d`）

## Phase 7: エラーハンドリング・実機テスト 🟡

- [x] OCR精度改善: `computeCellRectFromCorners` + `segmentBoardFromCorners`（双線形補間で透視歪み対応）
- [x] 写真ライブラリ権限拒否時のフォールバック（設定を開く誘導）
- [x] README.md 作成
- [x] `npm test` 35件グリーン / `npx tsc --noEmit` グリーン
- [ ] iOS実機テスト ← **ユーザー実施項目**
- [ ] Android実機 or エミュレータテスト ← **ユーザー実施項目**
- [ ] Gitコミット ← 承認待ち
- [ ] Push ← 承認待ち
- [ ] PR 作成 ← 承認待ち

## 更新方針

- 各Phase着手前に該当タスクの DoD を確認
- 各タスク完了時に `[ ]` → `[x]` を更新
- Phase完了時に該当行のステータスを ✅ にし、`最終更新` を更新
- コミット前に必ず `phases/phase-N-*.md` の「実装内容／動作確認／引き継ぎ」を埋める
