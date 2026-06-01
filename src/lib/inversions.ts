// インバージョン（転回型）のフレット位置を算出する
//
// triad（3音）はシンプルな転回： root pos = [R,3,5]、1st inv = [3,5,R]、2nd inv = [5,R,3]
// drop2（4音）はクローズ・ボイシングの上から2番目を1オクターブ下ろした並び。
//   close inv k = rotate(tones, k)、その上から2番目 = tones[(k+2)%4]
//   drop2 順序 = [ tones[(k+2)%4], tones[k%4], tones[(k+1)%4], tones[(k+3)%4] ]

import {
  STRING_OPEN_PITCH,
  noteIndex,
  type ChordQuality,
  QUALITY_TONES,
} from "@/lib/music";

export type Pattern = "triad" | "drop2";

export function patternOf(quality: ChordQuality): Pattern {
  const tones = QUALITY_TONES[quality];
  return tones.length === 4 ? "drop2" : "triad";
}

// インバージョン k で、低音弦→高音弦の順に並ぶ「半音オフセット」配列
export function inversionTones(quality: ChordQuality, inversion: number): number[] {
  const tones = QUALITY_TONES[quality];
  const k = ((inversion % tones.length) + tones.length) % tones.length;
  if (patternOf(quality) === "triad") {
    return tones.map((_, i) => tones[(i + k) % tones.length]);
  }
  return [
    tones[(k + 2) % 4],
    tones[(k + 0) % 4],
    tones[(k + 1) % 4],
    tones[(k + 3) % 4],
  ];
}

export interface StringGroup {
  id: string;
  label: string;
  strings: number[]; // 低音弦→高音弦
}

export const TRIAD_GROUPS: StringGroup[] = [
  { id: "1-3", label: "1〜3弦", strings: [3, 2, 1] },
  { id: "2-4", label: "2〜4弦", strings: [4, 3, 2] },
  { id: "3-5", label: "3〜5弦", strings: [5, 4, 3] },
  { id: "4-6", label: "4〜6弦", strings: [6, 5, 4] },
];

export const DROP2_GROUPS: StringGroup[] = [
  { id: "1-4", label: "1〜4弦", strings: [4, 3, 2, 1] },
  { id: "2-5", label: "2〜5弦", strings: [5, 4, 3, 2] },
  { id: "3-6", label: "3〜6弦", strings: [6, 5, 4, 3] },
];

export interface InversionForm {
  inversion: number;
  frets: number[];
  strings: number[];
  tones: number[]; // 各音の root からの半音
}

// あるコード（quality + rootNote）と弦グループで、すべての転回について
// 「指で押さえられる範囲(maxSpan以下)に収まるフォーム」を列挙する。
//
// 各転回ごとに、ベース音の最低出現位置から +12 フレット刻みでオクターブ違いを試し、
// 各音のピッチが昇順になるように高弦のフレットを +12 シフトする。
// 結果として max-min が maxSpan を超えるフォームはスキップ。
export function computeInversions(
  quality: ChordQuality,
  rootNote: string,
  group: StringGroup,
  options: { maxFret?: number; maxSpan?: number } = {},
): InversionForm[] {
  const { maxFret = 15, maxSpan = 5 } = options;
  const numInversions = QUALITY_TONES[quality].length;
  const rootIdx = noteIndex(rootNote);
  const forms: InversionForm[] = [];

  for (let k = 0; k < numInversions; k++) {
    const tones = inversionTones(quality, k);
    const targets = tones.map((t) => (t + rootIdx) % 12);
    const bassString = group.strings[0];
    const bassOpen = STRING_OPEN_PITCH[bassString];
    const bassClass = bassOpen % 12;
    const bassLowest = (((targets[0] - bassClass) % 12) + 12) % 12;

    // ベース音の各オクターブ位置を試す
    for (let bassFret = bassLowest; bassFret <= maxFret; bassFret += 12) {
      const frets: number[] = [bassFret];
      let prevPitch = bassOpen + bassFret;
      let valid = true;
      for (let i = 1; i < group.strings.length; i++) {
        const s = group.strings[i];
        const open = STRING_OPEN_PITCH[s];
        const openClass = open % 12;
        let fret = (((targets[i] - openClass) % 12) + 12) % 12;
        let pitch = open + fret;
        while (pitch <= prevPitch) {
          fret += 12;
          pitch += 12;
        }
        if (fret > maxFret) {
          valid = false;
          break;
        }
        frets.push(fret);
        prevPitch = pitch;
      }
      if (!valid) continue;
      const span = Math.max(...frets) - Math.min(...frets);
      if (span > maxSpan) continue;
      forms.push({ inversion: k, frets, strings: group.strings, tones });
    }
  }

  return forms;
}
