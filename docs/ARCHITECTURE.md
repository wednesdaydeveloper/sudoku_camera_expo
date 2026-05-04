# アーキテクチャ

最終更新: 2026-05-04

## システム全体図

```
┌─ Camera Screen ─────────────┐
│  expo-camera で撮影          │
│  expo-image-picker で選択    │
└──────────┬──────────────────┘
           │ 画像URI
           ▼
┌─ Grid Detection ────────────┐
│  ユーザーが4隅をタップ指定   │
│  expo-image-manipulator で  │
│  透視変換 → 正方形に補正     │
└──────────┬──────────────────┘
           │ 補正後画像
           ▼
┌─ Cell Segmentation ─────────┐
│  9x9 に分割（81セル画像）   │
└──────────┬──────────────────┘
           │
           ▼
┌─ Digit OCR ─────────────────┐
│  ML Kit Text Recognition or │
│  軽量CNN（Phase 5で確定）   │
└──────────┬──────────────────┘
           │ 9x9 数字配列
           ▼
┌─ Manual Correction ─────────┐
│  ユーザーがタップで修正     │
└──────────┬──────────────────┘
           │
           ▼
┌─ Solver ────────────────────┐
│  バックトラック+制約伝播    │
└──────────┬──────────────────┘
           │
           ▼
┌─ Result Screen ─────────────┐
│  解答グリッド表示           │
│  元の数字=黒、解答=青       │
└─────────────────────────────┘
```

## ディレクトリ構成

```
src/
├── solver/           # 数独ソルバ（純ロジック）
│   ├── types.ts      # Board, Cell 型
│   ├── validate.ts   # 妥当性検証
│   └── solve.ts      # バックトラック実装
├── grid/             # 盤面検出
│   ├── CornerPicker.tsx  # 4点指定UI
│   └── perspective.ts    # 透視変換
├── ocr/              # 数字認識
│   ├── segment.ts    # 9x9 セル分割
│   └── recognize.ts  # OCR本体
├── screens/          # 画面コンポーネント
│   ├── CameraScreen.tsx
│   ├── ReviewScreen.tsx
│   └── ResultScreen.tsx
└── types/            # 横断的な型定義
    └── index.ts
```

## モジュール責務

| モジュール | 責務 | 依存 |
|-----------|------|------|
| solver | 純ロジック。盤面配列を受け取って解を返す | なし（Reactにも依存しない） |
| grid | 撮影画像から盤面領域を抽出して矩形補正 | expo-image-manipulator |
| ocr | 補正画像から9x9の数字配列を取得 | OCRエンジン（Phase 5確定） |
| screens | 画面描画と状態遷移 | React Native, 各モジュール |

## 主要データ型

```typescript
// 0は空欄、1〜9は数字
type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// 9x9 二次元配列
type Board = Cell[][];

// 解の結果
type SolveResult =
  | { status: 'solved'; board: Board }
  | { status: 'invalid'; reason: string }
  | { status: 'unsolvable' };
```

## 状態遷移（MVP）

```
[Camera] ─撮影/選択─> [Review] ─解く─> [Result]
   ▲                     │
   └──── 戻る ────────────┘
```

App.tsx 内で `screen: 'camera' | 'review' | 'result'` の単純な状態管理で実装。ナビゲーションライブラリは未採用。

## 外部依存（Phase 1時点で確定）

- expo-camera ~17.0.10
- expo-image-picker ~17.0.11
- expo-image-manipulator ~14.0.8
- jest ~29.7.0 (devDependency)
- jest-expo ~54.0.17 (devDependency)

Phase 5 で OCR エンジン依存を追加予定。
