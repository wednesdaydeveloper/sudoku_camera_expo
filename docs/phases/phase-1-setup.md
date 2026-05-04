# Phase 1: プロジェクト基盤

## 目的

Expo + TypeScript の開発環境を整え、後続Phaseで必要なライブラリ（カメラ・画像処理）とテスト基盤を導入する。

## 完了条件 (Definition of Done)

- [x] Expo SDK 54 の TypeScript プロジェクト雛形が生成されている
- [x] `expo-camera` / `expo-image-picker` / `expo-image-manipulator` が導入されている
- [x] カメラ・写真ライブラリのパーミッションが `app.json` に設定されている
- [x] Jest + jest-expo のテスト基盤が導入されている
- [x] `npm test` が実行可能な状態（テスト未作成でもエラーにならない）
- [x] `npx tsc --noEmit` がエラーなしで通る
- [x] Gitコミット完了

## 設計判断

- **テンプレート**: `blank-typescript` を選択（`default` は expo-router/タブが過剰なため）→ ADR-002
- **ナビゲーション**: 初期は不採用。MVPは画面数が少ないので `App.tsx` の状態管理で済ませる → ADR-006
- **react-test-renderer**: React 19 で非推奨のため除外 → ADR-003

## 実装内容

### 追加・変更したファイル

- `package.json` - 依存追加、`test` スクリプト追加、jest preset 設定
- `app.json` - expo-camera, expo-image-picker のパーミッションプラグイン設定（日本語メッセージ）
- `App.tsx` - blank-typescript テンプレートのまま（Phase 3 で書き換え予定）
- `tsconfig.json` - blank-typescript デフォルト
- `index.ts` - エントリーポイント
- `assets/` - アイコン・スプラッシュ
- `.gitignore` - Expo標準テンプレートに置換

### 主要パッケージバージョン

```
expo: ~54.0.33
expo-camera: ~17.0.10
expo-image-picker: ~17.0.11
expo-image-manipulator: ~14.0.8
react: 19.1.0
react-native: 0.81.5
typescript: ~5.9.2
jest: ~29.7.0
jest-expo: ~54.0.17
```

## 動作確認

- `npx tsc --noEmit` → エラーなし
- `npm install` → 成功（700+ packages）

注意: 実機/シミュレータでの起動確認は Phase 3（カメラ画面実装）以降で実施する。

## 次Phaseへの引き継ぎ

- `App.tsx` は Phase 3 で書き換える。現状のテンプレートテキストは破棄予定
- ML Kit 系の導入は Phase 5。Development Build の必要性が顕在化する
- `npm audit` で moderate vulnerabilities が16件あるが、Expo SDK 54 由来の依存。Expo更新時に解決される見込み
- `src/` ディレクトリは Phase 2 でソルバを作る際に新規作成

## ステータス

✅ 完了（2026-05-04 / コミット `f8bf2a1`）
