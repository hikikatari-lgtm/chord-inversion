// 音楽理論ユーティリティ：音名・度数・スタンダードチューニング

export const NOTES_SHARP = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export const NOTES_FLAT = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
] as const;

// 標準チューニングの開放弦MIDIノート（番号でアクセス）
// 6弦=低E2(40)、5弦=A2(45)、4弦=D3(50)、3弦=G3(55)、2弦=B3(59)、1弦=高E4(64)
export const STRING_OPEN_PITCH: Record<number, number> = {
  6: 40,
  5: 45,
  4: 50,
  3: 55,
  2: 59,
  1: 64,
};

export function noteIndex(name: string): number {
  const s = NOTES_SHARP.indexOf(name as (typeof NOTES_SHARP)[number]);
  if (s >= 0) return s;
  const f = NOTES_FLAT.indexOf(name as (typeof NOTES_FLAT)[number]);
  if (f >= 0) return f;
  return 0;
}

export function noteName(idx: number, preferFlat = false): string {
  const i = ((idx % 12) + 12) % 12;
  return preferFlat ? NOTES_FLAT[i] : NOTES_SHARP[i];
}

const FLAT_ROOTS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb"]);
export function preferFlat(root: string): boolean {
  return FLAT_ROOTS.has(root);
}

export const ALL_ROOTS = [
  "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
] as const;

// ── コードクオリティ ─────────────────────────────────
export type TriadQuality = "maj" | "min" | "dim" | "aug";
export type SeventhQuality = "maj7" | "7" | "m7" | "m7b5";
export type ChordQuality = TriadQuality | SeventhQuality;

export const TRIAD_QUALITIES: TriadQuality[] = ["maj", "min", "dim", "aug"];
export const SEVENTH_QUALITIES: SeventhQuality[] = ["maj7", "7", "m7", "m7b5"];

// 各クオリティの音程（root=0 からの半音）
export const QUALITY_TONES: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  "7": [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
};

export const QUALITY_LABEL: Record<ChordQuality, string> = {
  maj: "メジャー",
  min: "マイナー",
  dim: "ディミニッシュ",
  aug: "オーギュメント",
  maj7: "M7",
  "7": "7",
  m7: "m7",
  m7b5: "m7(♭5)",
};

export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: "",
  min: "m",
  dim: "dim",
  aug: "aug",
  maj7: "M7",
  "7": "7",
  m7: "m7",
  m7b5: "m7(♭5)",
};

// 半音差をコードクオリティに応じた度数表記に変換
export function intervalDegree(semitones: number, quality: ChordQuality): string {
  const s = ((semitones % 12) + 12) % 12;
  switch (s) {
    case 0: return "R";
    case 3: return "♭3";
    case 4: return "3";
    case 6: return "♭5";
    case 7: return "5";
    case 8: return quality === "aug" ? "#5" : "♭6";
    case 9: return quality === "dim" ? "♭♭7" : "6";
    case 10: return "♭7";
    case 11: return "7";
    default: return String(s);
  }
}
