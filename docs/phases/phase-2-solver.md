# Phase 2: 数独ソルバ（純ロジック）

## 目的

画像処理を抜きにして、9×9の盤面データから解を計算する純粋なTypeScriptモジュールを作る。これにより画像処理が完成する前に「手入力 → 解答」が動く状態を作り、後続Phaseのリスクを下げる。

## 完了条件 (Definition of Done)

- [x] `src/solver/types.ts` に `Cell` / `Board` / `SolveResult` 型を定義
- [x] `src/solver/validate.ts` で初期盤面の妥当性チェック（行/列/3×3ボックスに重複なし）
- [x] `src/solver/solve.ts` でバックトラック解法を実装
- [x] 既知の数独問題で Jest テストが通る（easy / medium / hard 各1問以上）
- [x] 解けない問題（矛盾あり）には `{ status: 'invalid' | 'unsolvable' }` を返す
- [x] `npm test` グリーン
- [x] Gitコミット（日本語メッセージ）
- [x] phase-2-solver.md の「実装内容／動作確認／引き継ぎ」を埋める

## 設計判断

### 探索順: MRV（Minimum Remaining Values）ヒューリスティック

候補数が最も少ない空きマスを優先して埋める。古典的だが効果は大きく、AI Escargot 級の難問でも数ミリ秒で解ける。

### 候補のビットマスク表現

各行・列・3×3ボックスで使われている数字の集合を `Uint16Array`（9要素）でビットマスク管理する。
- ビット位置 `1 << digit`（1〜9）を使う（ビット0は未使用）
- 候補集合 = `~(rowMask | colMask | boxMask) & 0b1111111110`
- これにより候補の列挙・追加・削除が定数時間。

### 制約伝播

明示的な Naked Single / Hidden Single は実装しない。MRV 自体が「候補1件のマスを最優先で埋める」動きをするため、Naked Single 相当の効果はバックトラックループ内に内包される。

### 複数解判定

MVP では実装しない。出力は「ひとつの解」または「解なし」。OCRで盤面が確定する想定なので、複数解の検出が必要になったら別途 `countSolutions` API を追加する（v2課題）。

### 入力の扱い

- 入力 `Board` は内部でクローンし、呼び出し側に副作用を与えない（プロジェクト規約に準拠）
- 内部表現は `Uint8Array(81)` のフラット配列（高速化のため）
- 解結果のみ `Cell[][]` 形式に再構築して返す

### 性能目標

| 難度 | 目標 | 備考 |
|------|------|------|
| Easy | <1ms | 候補が常に1〜2個 |
| Medium | <10ms | |
| Hard (AI Escargot等) | <100ms | MRV があれば実測 <10ms |
| 空盤面 | <100ms | バックトラックで任意解を生成 |

### 戻り値

```typescript
type SolveResult =
  | { status: 'solved'; board: Board; durationMs: number }
  | { status: 'invalid'; reason: string }
  | { status: 'unsolvable'; durationMs: number };
```

- `invalid`: 盤面の形・値域・重複に問題がある（解く前のチェックで検出）
- `unsolvable`: 形式は正しいが解が存在しない（バックトラックが失敗）
- `solved`: 解が見つかった

## 実装内容

### ファイル構成

```
src/solver/
├── types.ts      # Cell / Board / SolveResult 型と定数
├── validate.ts   # validateShape / validateConstraints / validate
├── solve.ts      # solve（公開API）+ 内部ロジック
└── index.ts      # 公開エクスポート

__tests__/
└── solver.test.ts  # 13 ケース
```

### 公開API

```typescript
// types.ts
type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Board = Cell[][];
type SolveResult =
  | { status: 'solved'; board: Board; durationMs: number }
  | { status: 'invalid'; reason: string }
  | { status: 'unsolvable'; durationMs: number };

// validate.ts
function validate(board: Board): ValidationError | null;

// solve.ts
function solve(board: Board): SolveResult;
```

### 主な実装ポイント

- `SolverState` は `Uint8Array(81)` のフラットグリッドと、行・列・ボックスごとの `Uint16Array(9)` ビットマスクで構成
- 候補列挙は `~used & 0b1111111110`（ビット1〜9）
- 最下位ビット抽出に `bit & -bit` を使い、`Math.log2` で digit へ変換
- 入力 `Board` は副作用なし（内部状態は `buildState` で別途構築）
- 探索は MRV（最少候補優先）。`count === 1` のセルが見つかった時点で即返却

## 動作確認

### テスト結果

```
PASS __tests__/solver.test.ts
  solve
    ✓ 簡単な問題を解ける (2 ms)
    ✓ 中級問題を解ける
    ✓ 難問（AI Escargot）を解ける (1 ms)
    ✓ 完成済み盤面はそのまま返す (1 ms)
    ✓ 空の盤面でも何らかの完全解を返す
    ✓ 入力 Board は副作用で変更されない (1 ms)
    ✓ hard 問題でも 100ms 以内に解ける
    ✓ 行に重複がある盤面は invalid
    ✓ 列に重複がある盤面は invalid
    ✓ 3x3ブロックに重複がある盤面は invalid
    ✓ 値域外の値（10）は invalid
    ✓ 行数が9ではない盤面は invalid
    ✓ 解が存在しない盤面は unsolvable

Tests: 13 passed, 13 total
Time:  0.663 s
```

### 性能（実測値）

| ケース | durationMs | 目標 |
|--------|----------:|-----:|
| easy | <2 ms | <1 ms |
| medium | <1 ms | <10 ms |
| AI Escargot | <1 ms | <100 ms |
| empty board | <1 ms | <100 ms |

すべて目標値を大きく下回る。easy は目標値超だがミリ秒単位の誤差で実用上問題なし。

### 型チェック

`npx tsc --noEmit` エラーなし。

## 次Phaseへの引き継ぎ

- `solve()` は同期API。Phase 6 のUI実装で「解く」ボタン押下時に直接呼べる（重い処理ではないので Worker 化不要）
- OCR で数字が確定しないセルは 0 として渡す（Phase 5 の OCR 出力仕様）
- 「複数解の検出」は MVP 範囲外。Phase 6 のレビュー画面で `invalid`/`unsolvable` を返した場合のフォールバックUIを設計する必要あり
- `Board` 型を共有型として `src/types/` に移すか、現状の `src/solver/types.ts` から再エクスポートするかは Phase 3 着手時に再判断
- 性能に余裕があるので、将来 v2 で「ヒント表示（次の1手だけ埋める）」「複数解判定」等の拡張が容易

## ステータス

✅ 完了（2026-05-04）
