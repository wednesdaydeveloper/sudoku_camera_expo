# Phase 6: 結果画面と手動修正UI

## 目的

OCR結果をユーザーが確認・修正できる画面と、ソルバ実行後の解答画面を実装する。OCR誤認識を許容する安全弁を提供する。

## 完了条件 (Definition of Done)

- [x] `src/screens/ReviewScreen.tsx`: OCR結果を 9×9 グリッドで表示 + セルタップ編集
- [x] 各セルをタップ → 数字ピッカー（1〜9 + クリア）表示 → 値を変更できる
- [x] 「解く」ボタン → ソルバ実行
- [x] `src/screens/ResultScreen.tsx`: 解答グリッド表示
- [x] 元の数字は黒、解答セルは青で識別表示
- [x] エラー時のフィードバック（解けない／入力不正）Alert
- [x] 「最初からやり直す」導線
- [x] `npx tsc --noEmit` グリーン / `npm test` グリーン
- [x] iOS Simulator で動作確認（問題なし）
- [x] Gitコミット（`55a406d`）
- [ ] Push + PR ← 承認待ち

## 設計判断

### 数字入力 UI: ボトムオーバーレイ

セルをタップ → 画面下部にオーバーレイ表示（Modal 不使用）。

```
[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][ ✕ ]
```

- 外部ライブラリ不要
- ロジックがシンプル
- タップ外で閉じる（背後の View に onPress）

### OCR 元セルと編集セルの区別

ReviewScreen では **全セル編集可** とする。OCR は精度が低く、「OCR 結果を守る」より「ユーザーが自由に直せる」UX が有用。

ただし ResultScreen では、ソルバに渡した `confirmedBoard`（解く前の盤面）を保持し:
- `confirmedBoard[r][c] !== 0` → 黒（ヒント数字）
- それ以外（ソルバが埋めた） → 青

### 画面遷移

```
review (編集) → [解く]
  → solved    : result
  → invalid   : Alert（review に留まる）
  → unsolvable: Alert（review に留まる）
result → [最初からやり直す] → home
```

### ナビゲーション

引き続き App.tsx の `useState<Screen>` で管理。画面が 1 つ増えるが許容範囲。

## 実装内容

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/screens/ReviewScreen.tsx` | 全面改修：セル選択・DigitPicker・「解く」ボタン |
| `src/screens/ResultScreen.tsx` | 新規：解答グリッド（黒/青色分け）＋「やり直す」|
| `App.tsx` | `result` 状態、`handleSolve` 追加 |

### ReviewScreen の状態管理

```typescript
const [editedBoard, setEditedBoard] = useState<Board>(
  () => board.map(row => [...row]) as Board
);
const [selectedCell, setSelectedCell] = useState<{r,c} | null>(null);
```

セルタップ → `selectedCell` をセット → `DigitPicker` が表示される。数字ボタン押下で `editedBoard` を不変更新し `selectedCell` を null に。グリッド背景タップで `selectedCell` を null（ピッカーを閉じる）。

### ソルバとの接続（App.tsx）

`handleSolve(editedBoard)` → `solve(editedBoard)` → status 分岐:
- `solved` → `{ name: 'result', solvedBoard, confirmedBoard: editedBoard }` 遷移
- `invalid` → Alert（ReviewScreen に留まる）
- `unsolvable` → Alert（ReviewScreen に留まる）

## 動作確認

iOS Simulator で以下を確認:

1. **OCR → Review 遷移**: 補正後画像から OCR 実行 → ReviewScreen に 9×9 表示
2. **セル編集**: セルをタップ → ボトムオーバーレイに 1〜9 ＋ ✕ ボタン表示 → タップで値変更、グリッド外タップで閉じる
3. **解く（正常系）**: 正しい問題を手入力 → 「解く」→ ResultScreen に黒/青の解答表示
4. **解く（エラー系）**: 矛盾した値を入れて「解く」→ Alert「入力エラー」、ReviewScreen に留まる
5. **最初からやり直す**: ResultScreen から Home に戻る

**結果**: 問題なし。

## 次Phaseへの引き継ぎ

Phase 7 へ:
- OCR 精度改善（透視変換・前処理・ML Kit confidence）— ADR-008 参照
- カメラ権限拒否時のフォールバック UI
- Android 実機 / エミュレータ動作確認
- README 作成

## ステータス

✅ 完了
