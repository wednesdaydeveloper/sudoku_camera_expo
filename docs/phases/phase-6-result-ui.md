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
- [ ] iOS Simulator で動作確認 ← ユーザー実施
- [ ] Gitコミット（日本語メッセージ）→ 承認待ち
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

実装後に追記。

## 動作確認

実装後に追記。

## 次Phaseへの引き継ぎ

完了時に追記。

## ステータス

🟡 実装中
