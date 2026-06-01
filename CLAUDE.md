# Chord-Inversion

ギターの転回型ボイシングをフレットボード上で「形」と「度数」で見るアプリ。

- **トライアド (3音)**: メジャー / マイナー / ディミニッシュ / オーギュメント
  - 弦グループ: 1〜3 / 2〜4 / 3〜5 / 4〜6（各4種、計16）
- **Drop 2 (4音)**: M7 / 7 / m7 / m7♭5
  - 弦グループ: 1〜4 / 2〜5 / 3〜6

選んだコード（クオリティ + 弦グループ + ルート音）について、すべての転回をフレットボード上に同時表示する。

## 技術スタック
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Vercel デプロイ（GitHub連携、mainにpushで自動デプロイ）

## プロジェクト構成
```
src/
  app/
    layout.tsx            # ルートレイアウト
    page.tsx              # メインUI（クライアントコンポーネント）
  components/
    Fretboard.tsx         # SVGフレットボード、転回ごとに色分け
  lib/
    music.ts              # 音名・度数・コードクオリティ
    inversions.ts         # 転回フレットの算出（プログラマティック）
```

## データの考え方

フォームは**ハードコードせず動的計算**。

- `QUALITY_TONES`（lib/music.ts）にコードトーンを定義
- `computeInversions(quality, rootNote, group)`（lib/inversions.ts）で:
  - 各転回（triadは3、drop2は4）について
  - 低音弦→高音弦の順にコードトーンを並べる
  - 各弦の開放音から該当音までのフレットを算出し、ピッチが昇順になるよう+12オクターブシフト
- `visibleForms(forms, maxFret)` でフレット0〜15に収まる位置をすべて列挙（同一転回のオクターブ違いも含む）

ルート音を変えると全フォームが平行移動する。コードトーンを追加したいときは `QUALITY_TONES` に1行足すだけ。

## デプロイ
`git push origin main` で Vercel が自動デプロイ。

## 関連プロジェクト
- chord-lab: https://chord-lab-ten.vercel.app
- key-lab: https://key-lab-kappa.vercel.app
- guitar-chord: https://github.com/hikikatari-lgtm/guitar-chord

@AGENTS.md
