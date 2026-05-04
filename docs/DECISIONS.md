# 設計判断ログ (ADR)

このプロジェクトの主要な技術選択を記録する。新しい判断を行ったら追記する。

## 形式

各エントリは ADR-NNN 形式で、以下を含む:

- **状況**: 何を選ぶ必要があったか
- **判断**: どう選んだか
- **理由**: なぜそれにしたか
- **結果**: その判断による影響
- **代替案**: 検討して却下したもの

---

## ADR-001: Expo + React Native を採用

**状況**: スマホアプリ（iOS/Android両対応）開発のフレームワーク選定。

**判断**: Expo Managed Workflow + Development Build を採用。

**理由**:
- iOS/Android両対応を1コードベースで実現
- カメラ/画像処理プラグインのエコシステムが充実
- TypeScript標準対応
- Expo Goは制限が多いが Development Build で回避可能

**結果**:
- ビルドにEAS Buildを使う前提（または手元で prebuild → Xcode/Android Studio）
- ML Kit などのネイティブモジュールが導入可能になる

**代替案**:
- Flutter: Dart学習コスト
- React Native 純正: セットアップが煩雑
- Native iOS/Android別個: 工数2倍

**判断日**: 2026-05-04

---

## ADR-002: テンプレートは blank-typescript を採用

**状況**: create-expo-app のテンプレート選定。

**判断**: `blank-typescript` を採用。

**理由**:
- `default` テンプレートは expo-router とタブ構成が含まれ、本MVPには過剰
- 画面遷移が少ない（カメラ → レビュー → 結果）ので状態ベースの遷移で十分

**結果**:
- 後で必要になったら `expo-router` を追加導入できる（Phase 6で再評価）

**代替案**: `default`（過剰）/ `tabs`（より過剰）

**判断日**: 2026-05-04

---

## ADR-003: react-test-renderer を依存から除外

**状況**: jest-expo セットアップで `react-test-renderer` のpeer依存解決失敗。

**判断**: `react-test-renderer` を入れずに先に進む。

**理由**:
- React 19 で非推奨化されており、peer dependency解決が壊れている
- Phase 2のソルバは純ロジックでReactレンダラ不要
- コンポーネントのテストが必要になった時点で `@testing-library/react-native` を採用する

**結果**: コンポーネントテストは Phase 6以降に判断を持ち越し。

**代替案**: バージョンを強制ピン留め（peer dependency conflict が伝播するためリスク高い）

**判断日**: 2026-05-04

---

## ADR-004: 盤面検出はMVPで手動4点指定

**状況**: 撮影画像から数独盤面の領域を抽出する方法。

**判断**: Phase 4 では **ユーザが4隅を手動指定** する方式で実装する。自動検出は将来課題。

**理由**:
- 自動検出（OpenCV系の最大輪郭抽出）はネイティブモジュールが必要で実装コストが高い
- 手動4点指定でも実用上ストレスは少なく、UI的にも明示的でわかりやすい
- 透視変換そのものは expo-image-manipulator で完結

**結果**:
- Phase 4 の工数を圧縮
- 自動検出を行う場合は別Phase or 後続バージョンで `react-native-vision-camera` + opencv 系を検討

**代替案**:
- 自動検出（OpenCV）: 実装重い、Expo Go不可
- サーバ側処理: ネットワーク必須、UX悪化

**判断日**: 2026-05-04

---

## ADR-005: OCRは端末内（ML Kit想定）

**状況**: 数字認識の方式選定。

**判断**: 端末内OCR（ML Kit Text Recognition想定）を採用予定。Phase 5で最終確定。

**理由**:
- オフラインで動作
- レスポンスが速い（クラウド往復不要）
- コストゼロ（API課金なし）

**結果**:
- Development Build 必須（Expo Go不可）
- `@react-native-ml-kit/text-recognition` 等のネイティブモジュールを Phase 5 で導入

**代替案**:
- Google Cloud Vision API: 通信必須、要API課金
- 自前CNN（TensorFlow Lite）: 学習データ整備が重い
- Tesseract系: 印刷数字に対する精度がML Kitに劣ることが多い

**判断日**: 2026-05-04（Phase 5 で再確認）

---

## ADR-006: ナビゲーションは初期不採用

**状況**: 画面遷移の実装方法。

**判断**: MVP では `App.tsx` の `useState` で `screen` を切り替える。`expo-router` / `react-navigation` は導入しない。

**理由**:
- 画面が3つ程度で済む
- ナビゲーションライブラリのオーバーヘッド・学習コストを避けたい

**結果**:
- 戻る／進む遷移は手動でハンドリング
- 画面が増えたら Phase 6 で `expo-router` を再評価

**代替案**: `expo-router` / `react-navigation`（過剰）

**判断日**: 2026-05-04

---

## ADR-007: コミットメッセージは日本語

**状況**: Gitのコミットメッセージ言語選定。

**判断**: subject/body 共に日本語で記述。コマンド名・コード片・`Co-Authored-By` 行は英語のまま。

**理由**:
- ユーザの明示的な指示
- プロジェクトUIも日本語で統一しているので履歴も日本語の方が読みやすい

**結果**:
- Phase 1 のコミット (`f8bf2a1`) は英語だったが、以降の全コミットは日本語に統一する

**判断日**: 2026-05-04
