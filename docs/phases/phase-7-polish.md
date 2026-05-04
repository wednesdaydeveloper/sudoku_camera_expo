# Phase 7: エラーハンドリング・実機テスト・仕上げ

## 目的

エンドツーエンドで実機検証し、エラー時のUX を整え、READMEを整備して MVP リリース可能な状態にする。

## 完了条件 (Definition of Done)

### OCR 精度改善（Phase 5 から持ち越し）

- [ ] 透視変換の導入（`cropToBoundingRect` の axis-aligned 切り抜きを 4 点射影変換に置き換え。ADR-008 参照）
- [ ] セル前処理（グレースケール／二値化／コントラスト強調）の効果検証
- [ ] ML Kit `confidence` の活用 — `result.blocks[].lines[].elements[].confidence` でしきい値フィルタ
- [ ] 代替 OCR（Apple Vision Framework）の検証（iOS のみ、単一数字に強い）
- [ ] OCR 精度の定量評価（少なくとも 5 枚のサンプル画像で正解率を記録）

### エラーハンドリング・UX

- [ ] カメラ／写真ライブラリの権限拒否時のフォールバックUI
- [ ] OCR精度が低い場合のリカバリ導線（再撮影／手動入力モードへ切替）
- [ ] 解けない問題のフィードバック改善

### 実機テスト

- [ ] iOS実機テスト（少なくとも iPhone 1機種）
- [ ] Android実機 もしくはエミュレータテスト（少なくとも1機種）

### 仕上げ

- [ ] アプリアイコン・スプラッシュの最低限の調整
- [ ] `README.md`（簡易ユーザー向け／開発者向けガイド）
- [ ] 既知の問題リストを `docs/PROGRESS.md` に追記
- [ ] Gitコミット（日本語メッセージ）

## 設計判断

- **双線形補間でパース補正を近似**: 透視変換ライブラリを追加せず、4隅からの双線形補間でセル座標を算出。精度改善の主因は「中間クロップなしに元画像から直接切り出す」ことで、行ズレ・列ズレを解消。ADR-008 参照。
- **写真ライブラリ権限**: `getMediaLibraryPermissionsAsync` で事前確認 → `canAskAgain` 分岐で `requestMediaLibraryPermissionsAsync` または `Linking.openSettings()` 誘導。

## 実装内容

### A: OCR 精度改善（双線形補間）

- `src/ocr/segment.ts` に `computeCellRectFromCorners` / `segmentBoardFromCorners` を追加
  - 4隅 (Corners) と imageSize から双線形補間でセル座標を算出
  - 元画像に直接 81 回クロップ（中間 bounding rect 画像を経由しない）
- `src/ocr/index.ts` に新関数をエクスポート追加
- `src/screens/CornerPickerScreen.tsx` の `onCropped` コールバックを `(result, imageCorners, naturalSize)` に変更
- `App.tsx` の OCR パイプラインを `segmentBoardFromCorners` へ切り替え、`croppedPreview` 状態に `corners` / `naturalSize` / `originalImageUri` を保持

### B: 写真ライブラリ権限エラーハンドリング

- `App.tsx` の `handlePickPhoto` に `getMediaLibraryPermissionsAsync` による事前チェックを追加
  - `canAskAgain` が true → `requestMediaLibraryPermissionsAsync` でシステムダイアログ
  - 永続拒否済み → Alert + 「設定を開く」ボタン（`Linking.openSettings()`）

### C: README.md

- プロジェクトルートに `README.md` を作成（概要・使い方・セットアップ・アーキテクチャ・技術スタック）

## 動作確認

- `npm test`: 35件グリーン（Phase 7 で `computeCellRectFromCorners` の 6 ケースを追加）
- `npx tsc --noEmit`: エラーなし

## 次Phaseへの引き継ぎ

- iOS・Android実機テストは未実施（エミュレータ確認のみ）
- OCR精度の定量評価（5枚以上のサンプル画像）は未実施
- Apple Vision Framework による代替 OCR は未検討
- アイコン・スプラッシュのカスタマイズは未対応

## ステータス

🟡 進行中（実機テスト・定量評価は持ち越し）
