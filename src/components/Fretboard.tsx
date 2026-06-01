"use client";

import {
  STRING_OPEN_PITCH,
  intervalDegree,
  noteName,
  preferFlat,
  type ChordQuality,
} from "@/lib/music";
import type { InversionForm } from "@/lib/inversions";

interface Props {
  forms: InversionForm[]; // 同時表示するすべてのインバージョン（オクターブ違いも含む）
  quality: ChordQuality;
  rootNote: string;
  display: "degree" | "note";
}

// インバージョンごとに少しずつ色相を変えて区別する（同時に複数表示するため）
const INVERSION_HUES = [38, 142, 196, 286]; // amber, emerald, sky, purple
function inversionColor(inv: number, isRoot: boolean): { fill: string; text: string } {
  if (isRoot) return { fill: "#e6b800", text: "#1a1a1d" };
  const h = INVERSION_HUES[inv % INVERSION_HUES.length];
  return { fill: `hsl(${h} 70% 55%)`, text: "#0b0b0c" };
}

export default function Fretboard({ forms, quality, rootNote, display }: Props) {
  const NUM_FRETS = 15;
  const fretWidth = 50;
  const stringSpacing = 28;
  const padX = 36;
  const padY = 32;
  const width = padX * 2 + fretWidth * NUM_FRETS;
  const height = padY * 2 + stringSpacing * 5;
  const useFlats = preferFlat(rootNote);

  // 表示順：上から 1弦(高E)→6弦(低E)
  const displayOrder = [1, 2, 3, 4, 5, 6];
  const stringRow: Record<number, number> = {};
  displayOrder.forEach((s, row) => (stringRow[s] = row));

  const inlayFrets = [3, 5, 7, 9, 12, 15];
  const doubleInlayFrets = [12];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        style={{ minWidth: width }}
      >
        {/* 指板背景 */}
        <rect
          x={padX}
          y={padY - 8}
          width={fretWidth * NUM_FRETS}
          height={stringSpacing * 5 + 16}
          fill="#1a1a1d"
          rx={4}
        />
        {/* インレイ */}
        {Array.from({ length: NUM_FRETS }, (_, i) => i + 1)
          .filter((f) => inlayFrets.includes(f))
          .map((f) => {
            const cx = padX + fretWidth * (f - 0.5);
            const cy = padY + (stringSpacing * 5) / 2;
            if (doubleInlayFrets.includes(f)) {
              return (
                <g key={f}>
                  <circle cx={cx} cy={cy - stringSpacing} r={4} fill="#3a3a3e" />
                  <circle cx={cx} cy={cy + stringSpacing} r={4} fill="#3a3a3e" />
                </g>
              );
            }
            return <circle key={f} cx={cx} cy={cy} r={4} fill="#3a3a3e" />;
          })}
        {/* ナット */}
        <rect
          x={padX - 4}
          y={padY - 8}
          width={6}
          height={stringSpacing * 5 + 16}
          fill="#e5e5e5"
        />
        {/* フレット線 */}
        {Array.from({ length: NUM_FRETS + 1 }, (_, i) => (
          <line
            key={i}
            x1={padX + fretWidth * i}
            y1={padY - 8}
            x2={padX + fretWidth * i}
            y2={padY + stringSpacing * 5 + 8}
            stroke="#6a6a6e"
            strokeWidth={i === 0 ? 0 : 2}
          />
        ))}
        {/* 弦 */}
        {displayOrder.map((sNum, row) => (
          <line
            key={sNum}
            x1={padX}
            y1={padY + stringSpacing * row}
            x2={padX + fretWidth * NUM_FRETS}
            y2={padY + stringSpacing * row}
            stroke="#cccccc"
            strokeWidth={0.8 + row * 0.25}
            opacity={0.85}
          />
        ))}
        {/* フレット番号 */}
        {Array.from({ length: NUM_FRETS }, (_, i) => i + 1).map((f) => (
          <text
            key={f}
            x={padX + fretWidth * (f - 0.5)}
            y={padY + stringSpacing * 5 + 20}
            textAnchor="middle"
            fontSize={9}
            fill="#7a7a7e"
            fontFamily="monospace"
          >
            {f}
          </text>
        ))}
        {/* グリップごとに envelope を描く：ドットを囲む形を転回色で薄く塗る。
            重なるグリップでも所属が分かるように、転回色をそのまま使う。 */}
        {forms.map((f, fi) => {
          // 各ドットの座標
          const points = f.strings.map((s, i) => {
            const fret = f.frets[i];
            const x = fret === 0 ? padX - 16 : padX + fretWidth * (fret - 0.5);
            const y = padY + stringSpacing * stringRow[s];
            return [x, y] as [number, number];
          });
          // 重心
          const cxC =
            points.reduce((acc, [x]) => acc + x, 0) / points.length;
          const cyC =
            points.reduce((acc, [, y]) => acc + y, 0) / points.length;
          // ドット外側に膨らませた envelope の頂点
          const PAD = 18;
          const expanded = points.map(([x, y]) => {
            const dx = x - cxC;
            const dy = y - cyC;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            return [x + (dx / dist) * PAD, y + (dy / dist) * PAD] as [
              number,
              number,
            ];
          });
          // 重心まわりに角度ソート（自己交差を避ける）
          const sorted = expanded.slice().sort((a, b) => {
            const angleA = Math.atan2(a[1] - cyC, a[0] - cxC);
            const angleB = Math.atan2(b[1] - cyC, b[0] - cxC);
            return angleA - angleB;
          });
          const pts = sorted.map(([x, y]) => `${x},${y}`).join(" ");
          const hue = INVERSION_HUES[f.inversion % INVERSION_HUES.length];
          return (
            <polygon
              key={`env-${fi}`}
              points={pts}
              fill={`hsl(${hue} 70% 55%)`}
              fillOpacity={0.1}
              stroke={`hsl(${hue} 70% 55%)`}
              strokeOpacity={0.55}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          );
        })}
        {/* 押弦 */}
        {forms.map((f, fi) =>
          f.strings.map((s, i) => {
            const fret = f.frets[i];
            const cx =
              fret === 0 ? padX - 16 : padX + fretWidth * (fret - 0.5);
            const cy = padY + stringSpacing * stringRow[s];
            const openClass = STRING_OPEN_PITCH[s] % 12;
            const noteIdx = (openClass + fret) % 12;
            const interval = f.tones[i];
            const degree = intervalDegree(interval, quality);
            const isRoot = degree === "R";
            const color = inversionColor(f.inversion, isRoot);
            return (
              <g key={`n-${fi}-${i}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={11}
                  fill={color.fill}
                  stroke={isRoot ? "#fff" : "#1a1a1d"}
                  strokeWidth={isRoot ? 1.5 : 1}
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fill={color.text}
                  fontFamily="monospace"
                >
                  {display === "degree"
                    ? degree
                    : noteName(noteIdx, useFlats)}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
