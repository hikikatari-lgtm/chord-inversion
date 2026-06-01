// コード進行のパースとプリセット

import { SEVENTH_QUALITIES, type ChordQuality } from "@/lib/music";

export interface ChordRef {
  root: string; // "C", "D#" など
  quality: ChordQuality;
}

export interface ProgressionPreset {
  id: string;
  label: string;
  family: "triad" | "drop2";
  chords: ChordRef[];
}

export const PRESETS: ProgressionPreset[] = [
  {
    id: "2-5-1",
    label: "ツーファイブワン (Dm7→G7→CM7)",
    family: "drop2",
    chords: [
      { root: "D", quality: "m7" },
      { root: "G", quality: "7" },
      { root: "C", quality: "maj7" },
    ],
  },
  {
    id: "1-6-2-5",
    label: "1625 (CM7→A7→Dm7→G7)",
    family: "drop2",
    chords: [
      { root: "C", quality: "maj7" },
      { root: "A", quality: "7" },
      { root: "D", quality: "m7" },
      { root: "G", quality: "7" },
    ],
  },
  {
    id: "minor-2-5-1",
    label: "マイナー251 (Bm7♭5→E7→Am7)",
    family: "drop2",
    chords: [
      { root: "B", quality: "m7b5" },
      { root: "E", quality: "7" },
      { root: "A", quality: "m7" },
    ],
  },
  {
    id: "triad-1-4-5",
    label: "トライアド I-IV-V (C→F→G)",
    family: "triad",
    chords: [
      { root: "C", quality: "maj" },
      { root: "F", quality: "maj" },
      { root: "G", quality: "maj" },
    ],
  },
];

// "Dm7" や "CM7" のような表記をパース
// 認識する quality:
//   "" -> maj, "m" -> min, "dim" -> dim, "aug" -> aug,
//   "M7"/"maj7"/"△7" -> maj7, "7" -> 7, "m7" -> m7,
//   "m7b5"/"m7♭5"/"ø" -> m7b5
const QUALITY_PATTERNS: { re: RegExp; q: ChordQuality }[] = [
  { re: /^(M7|maj7|△7|Δ7)$/i, q: "maj7" },
  { re: /^m7(b5|♭5)$/i, q: "m7b5" },
  { re: /^ø$/i, q: "m7b5" },
  { re: /^m7$/i, q: "m7" },
  { re: /^7$/i, q: "7" },
  { re: /^m$/i, q: "min" },
  { re: /^dim$/i, q: "dim" },
  { re: /^aug$/i, q: "aug" },
  { re: /^$/, q: "maj" },
];

const ROOT_RE = /^([A-G])([#b♭]?)/;

export function parseChord(token: string): ChordRef | null {
  const m = ROOT_RE.exec(token);
  if (!m) return null;
  const accidental = m[2] === "♭" ? "b" : m[2];
  const root = m[1] + accidental;
  const tail = token.slice(m[0].length);
  for (const { re, q } of QUALITY_PATTERNS) {
    if (re.test(tail)) return { root: normalizeRoot(root), quality: q };
  }
  return null;
}

function normalizeRoot(r: string): string {
  // "Db" -> "Db", "C#" -> "C#"。music.ts の ALL_ROOTS 上の表記に近づける。
  return r;
}

export function parseProgression(text: string): ChordRef[] {
  const tokens = text.trim().split(/[\s,]+/).filter(Boolean);
  const out: ChordRef[] = [];
  for (const t of tokens) {
    const c = parseChord(t);
    if (c) out.push(c);
  }
  return out;
}

// 進行内で出てくるクオリティに合わせて、triad / drop2 のどちらかを推定する
export function inferFamily(chords: ChordRef[]): "triad" | "drop2" {
  for (const c of chords) {
    if (SEVENTH_QUALITIES.includes(c.quality as never)) return "drop2";
  }
  return "triad";
}
