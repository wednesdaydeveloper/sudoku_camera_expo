# 開発進捗

最終更新: 2026-05-04（Phase 3 実装完了・実機検証はユーザー側）

## サマリ

| Phase | 内容 | ステータス | 詳細 |
|-------|------|-----------|------|
| 1 | プロジェクト基盤 | ✅ 完了 | [phase-1-setup.md](phases/phase-1-setup.md) |
| 2 | 数独ソルバ（純ロジック） | ✅ 完了 | [phase-2-solver.md](phases/phase-2-solver.md) |
| 3 | カメラ／画像取得画面 | 🟡 実装完了/実機検証中 | [phase-3-camera.md](phases/phase-3-camera.md) |
| 4 | 盤面検出（手動4点指定） | ⚪ 未着手 | [phase-4-grid-detect.md](phases/phase-4-grid-detect.md) |
| 5 | セル分割＋数字OCR | ⚪ 未着手 | [phase-5-ocr.md](phases/phase-5-ocr.md) |
| 6 | 結果画面と手動修正UI | ⚪ 未着手 | [phase-6-result-ui.md](phases/phase-6-result-ui.md) |
| 7 | エラーハンドリング・実機テスト | ⚪ 未着手 | [phase-7-polish.md](phases/phase-7-polish.md) |

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

## Phase 4: 盤面検出（手動4点指定） ⚪

- [ ] `src/grid/CornerPicker.tsx`: 画像上で4隅をドラッグ可能に
- [ ] `src/grid/perspective.ts`: 4点 → 正方形への透視変換行列
- [ ] expo-image-manipulator で補正画像生成
- [ ] 補正後の見た目を確認できるプレビュー
- [ ] Gitコミット

## Phase 5: セル分割＋数字OCR ⚪

- [ ] `src/ocr/segment.ts`: 9x9 にセル分割
- [ ] OCRエンジン選定確定（ML Kit / TFLite / その他）
- [ ] Development Build セットアップ手順をドキュメント化
- [ ] `src/ocr/recognize.ts`: 各セルから数字 0-9 を取得（0は空欄）
- [ ] 1〜2枚のサンプル画像で精度確認
- [ ] Gitコミット

## Phase 6: 結果画面と手動修正UI ⚪

- [ ] `src/screens/ReviewScreen.tsx`: OCR結果を9x9で表示、タップで修正
- [ ] `src/screens/ResultScreen.tsx`: ソルバ実行 → 解答表示（元の数字は黒、解答は青）
- [ ] エラー（解けない／入力不正）のフィードバック
- [ ] Gitコミット

## Phase 7: エラーハンドリング・実機テスト ⚪

- [ ] カメラ権限拒否時のフォールバック導線
- [ ] OCR精度が低い場合のリカバリ
- [ ] iOS実機テスト
- [ ] Android実機 or エミュレータテスト
- [ ] README作成（簡易ユーザ向けガイド）
- [ ] Gitコミット

## 更新方針

- 各Phase着手前に該当タスクの DoD を確認
- 各タスク完了時に `[ ]` → `[x]` を更新
- Phase完了時に該当行のステータスを ✅ にし、`最終更新` を更新
- コミット前に必ず `phases/phase-N-*.md` の「実装内容／動作確認／引き継ぎ」を埋める
