# CLAUDE.md

このファイルは Claude Code がプロジェクトで作業する際の標準ルールとコンテキストを記述する。新しい知見が得られたら本ファイルへ追記する。

## プロジェクト概要

- **名前**: sudoku-camera-expo
- **目的**: スマホカメラで数独問題を撮影し、画像処理＋OCRで盤面を読み取り自動で解くアプリ
- **対象OS**: iOS / Android（両方）
- **配信形態**: Expo Development Build（Expo Go ではネイティブML/CVモジュールが動かないため）
- **言語UI**: 日本語

## 技術スタック

| 領域 | 採用 | 備考 |
|------|------|------|
| フレームワーク | Expo SDK 54 / React Native 0.81 / React 19.1 | New Architecture 有効 |
| 言語 | TypeScript 5.9 | strict |
| 撮影 | `expo-camera` | パーミッション設定済 |
| 画像読込 | `expo-image-picker` | パーミッション設定済 |
| 画像変換 | `expo-image-manipulator` | クロップ・回転 |
| OCR | ML Kit 系（Phase 5 で確定） | 端末内で動作する印刷数字認識 |
| テスト | Jest + `jest-expo` | ソルバ等の純ロジック検証 |

## ディレクトリ構成

```
.
├── App.tsx              # エントリーポイント（registerRootComponent）
├── index.ts             # ルート登録
├── app.json             # Expo 設定（権限・プラグイン）
├── src/                 # アプリケーションコード（Phase 2 以降で作成）
│   ├── solver/          # 数独ソルバ（純ロジック）
│   ├── grid/            # 盤面検出・透視変換
│   ├── ocr/             # 数字認識
│   ├── screens/         # 画面コンポーネント
│   └── types/           # 共有型
├── docs/                # プロジェクトドキュメント
│   ├── PROGRESS.md      # 全Phaseの進捗
│   ├── ARCHITECTURE.md  # アーキテクチャ概要
│   ├── UI-DESIGN.md     # 画面遷移・レイアウト・デザイントークン
│   ├── DECISIONS.md     # 設計判断ログ（ADR）
│   └── phases/          # Phaseごとの詳細
└── assets/              # 画像・アイコン
```

## 開発ワークフロー（必読）

- **Phaseごとに必ず停止**: 各Phaseが完了したら必ずユーザーに報告し、承認を得てから次Phaseへ進む。途中で勝手に複数Phaseを進めない。
- **ドキュメント駆動**:
  - Phase開始時: `docs/phases/phase-N-*.md` を更新（目的・完了条件 (DoD) を明確化）
  - Phase終了時: 実装内容・動作確認結果・引き継ぎ事項を記入
- **進捗の同期**: `docs/PROGRESS.md` のチェックボックスを更新
- **設計判断**: 重要な技術選択は `docs/DECISIONS.md` に追記（ADR形式）
- **Gitコミット**: 各Phase完了ごと、subject/body 共に **日本語** で記述。Co-Authored-By 行は英語のままで可
- **Push / PR ワークフロー（Phase 3 以降）**:
  - Phase 開始時に feature branch を切る（例: `phase-3-camera`、`phase-4-grid-detect`）
  - Phase 内のコミットは feature branch 上に積む
  - Phase 完了 → ローカルコミット完了 → **ユーザーに push 可否を確認**
  - 承認後は **push と PR 作成を続けて実施**（1度の承認で両方）
    - `git push -u origin <branch>` → そのまま `gh pr create`
  - **承認なしに push を行わない**
  - PR タイトル: `Phase N: <要約>`（日本語）
  - PR 本文: 変更点の要約、テスト結果、関連ドキュメントへのリンク、スクリーンショット（UI を含む場合）。日本語で記述
  - マージ後（または PR レビュー反映後）に main を pull し、次 Phase の feature branch を main から切る
- **CLAUDE.md の更新**: プロジェクト共通の知見・規約・既知の罠が出たら本ファイルに追記

## コーディング規約

- TypeScript strict
- 公開関数・コンポーネント Props には明示的な型
- `any` は使わず `unknown` で narrow
- `React.FC` は使わない
- `interface` をオブジェクト形状に、`type` を union/intersection に
- 不変更新（spread）
- `console.log` を本番コードに残さない（必要なログは将来的に専用ロガーへ）
- 文字列リテラル union を `enum` より優先

## よく使うコマンド

| 用途 | コマンド |
|------|----------|
| 開発サーバ起動 | `npm start` |
| iOSシミュレータ | `npm run ios` |
| Androidエミュレータ | `npm run android` |
| Webプレビュー | `npm run web` |
| ユニットテスト | `npm test` |
| 型チェック | `npx tsc --noEmit` |
| 依存追加（Expo互換） | `npx expo install <pkg>` |

## 既知の制約・注意点

- **Expo Go では動作しない**: Phase 5 で ML Kit 系ネイティブモジュールを導入したため、以降は Development Build 必須。
- **iOS deployment target は 15.5**: `@react-native-ml-kit/text-recognition` の要求により、`expo-build-properties` で iOS 最小バージョンを 15.5 に設定。Expo SDK 54 デフォルトの 15.1 から引き上げ。
- `react-test-renderer` は React 19 で非推奨。コンポーネント単位テストが必要になったら `@testing-library/react-native` を採用する。
- `app.json` の `plugins` でカメラ・写真ライブラリの権限文字列（日本語）を設定済み。
- ホストOSは macOS（iOS実機/Simulator で動作確認可能）。
- npm audit で moderate vulnerabilities が16件あり（Expo SDK 54 の依存に由来、Expo側の更新待ち）。
- GateGuard フックを `ECC_GATEGUARD=off` で無効化したセッションを使うと、新規ファイル作成時の事実提示プロンプトが省略される（初期セットアップ・大量ドキュメント生成向け）。

## 進捗

最新の状態は `docs/PROGRESS.md` を参照。

## 更新履歴

- 2026-05-04: 初版作成（Phase 1 完了時点）
- 2026-05-04: `docs/UI-DESIGN.md` 追加（画面遷移・レイアウト案・デザイントークン）
- 2026-05-04: Push / PR ワークフローを追加（Phase 3 以降は feature branch 運用、push と PR 作成にユーザー承認を必須化）
- 2026-05-04: Push 承認後に PR 作成も連続して実施するよう変更（承認は1回で両方カバー）
