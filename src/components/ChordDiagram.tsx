"use client";

// 教則本のような「小さいコード・ダイアグラム」を1つ描く。
// 縦軸=弦、横軸=フレット。表示するフレット範囲は form のフレットに合わせて自動。

import {
  STRING_OPEN_PITCH,
  intervalDegree,
  noteName,
  preferFlat,
  type ChordQuality,
} from "@/lib/music";
import type { InversionForm } from "@/lib/inversions";

interface Props {
  form: InversionForm;
  quality: ChordQuality;
  rootNote: string;
  display: "degree" | "note";
  title?: string;
}

export default function ChordDiagram({
  form,
  quality,
  rootNote,
  display,
  title,
}: Props) {
  const useFlats = preferFlat(rootNote);
  const minF = Math.min(...form.frets);
  const maxF = Math.max(...form.frets);
  // 表示するフレット範囲（最低3フレット幅、左右に少し余白）
  const startFret = Math.max(0, minF - 1);
  const visible = Math.max(4, maxF - startFret + 2);

  // 弦は 6 → 1 を上から下、または上=高音弦で描く。
  // 教則本に合わせて上=高音弦（1弦）、下=低音弦にする
  const allStrings = [1, 2, 3, 4, 5, 6];
  const fretWidth = 26;
  const stringSpacing = 14;
  const padX = 18;
  const padY = 18;
  const width = padX * 2 + fretWidth * visible;
  const height = padY * 2 + stringSpacing * (allStrings.length - 1) + 14;

  return (
    <div className="inline-block">
      {title ? (
        <div className="mb-1 text-center font-mono text-sm font-bold text-amber-400">
          {title}
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        style={{ width, height }}
      >
        {/* 背景 */}
        <rect
          x={padX}
          y={padY - 4}
          width={fretWidth * visible}
          height={stringSpacing * (allStrings.length - 1) + 8}
          fill="#1a1a1d"
          rx={3}
        />
        {/* ナット（startFret==0 のとき） */}
        {startFret === 0 ? (
          <rect
            x={padX - 3}
            y={padY - 4}
            width={4}
            height={stringSpacing * (allStrings.length - 1) + 8}
            fill="#e5e5e5"
          />
        ) : null}
        {/* フレット線 */}
        {Array.from({ length: visible + 1 }, (_, i) => (
          <line
            key={i}
            x1={padX + fretWidth * i}
            y1={padY - 4}
            x2={padX + fretWidth * i}
            y2={padY + stringSpacing * (allStrings.length - 1) + 4}
            stroke="#6a6a6e"
            strokeWidth={i === 0 && startFret > 0 ? 1 : 1.5}
          />
        ))}
        {/* 弦線 */}
        {allStrings.map((_, row) => (
          <line
            key={row}
            x1={padX}
            y1={padY + stringSpacing * row}
            x2={padX + fretWidth * visible}
            y2={padY + stringSpacing * row}
            stroke="#bbbbbb"
            strokeWidth={0.7 + row * 0.18}
            opacity={0.85}
          />
        ))}
        {/* フレット番号（左端のフレット位置） */}
        <text
          x={padX + fretWidth * 0.5}
          y={padY + stringSpacing * (allStrings.length - 1) + 16}
          textAnchor="middle"
          fontSize={9}
          fill="#9a9a9e"
          fontFamily="monospace"
        >
          {startFret + 1}
        </text>
        {/* ノート */}
        {form.strings.map((s, i) => {
          const row = allStrings.indexOf(s);
          const fret = form.frets[i];
          // fret 0 は開放弦：ナット左側にマーカー
          const cx =
            fret === 0
              ? padX - 10
              : padX + fretWidth * (fret - startFret - 0.5);
          const cy = padY + stringSpacing * row;
          const openClass = STRING_OPEN_PITCH[s] % 12;
          const noteIdx = (openClass + fret) % 12;
          const degree = intervalDegree(form.tones[i], quality);
          const isRoot = degree === "R";
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={8}
                fill={isRoot ? "#e6b800" : "#4ade80"}
                stroke={isRoot ? "#fff" : "#1a1a1d"}
                strokeWidth={isRoot ? 1.2 : 1}
              />
              <text
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                fontSize={7.5}
                fontWeight={700}
                fill={isRoot ? "#1a1a1d" : "#0b0b0c"}
                fontFamily="monospace"
              >
                {display === "degree"
                  ? degree
                  : noteName(noteIdx, useFlats)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
