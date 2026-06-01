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

// 4音コードか3音コードかを判定（drop2 で扱うのは7thコード4種）
export function patternOf(quality: ChordQuality): Pattern {
  const tones = QUALITY_TONES[quality];
  return tones.length === 4 ? "drop2" : "triad";
}

// インバージョン k で、低音弦→高音弦の順に並ぶ「半音オフセット」配列
export function inversionTones(quality: ChordQuality, inversion: number): number[] {
  const tones = QUALITY_TONES[quality];
  const k = ((inversion % tones.length) + tones.length) % tones.length;
  if (patternOf(quality) === "triad") {
    // 単純なローテーション
    return tones.map((_, i) => tones[(i + k) % tones.length]);
  }
  // drop2
  return [
    tones[(k + 2) % 4],
    tones[(k + 0) % 4],
    tones[(k + 1) % 4],
    tones[(k + 3) % 4],
  ];
}

// 弦グループの定義（低音弦→高音弦の順で弦番号を並べる）
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
  inversion: number; // 0,1,2 (or 0..3 for drop2)
  frets: number[]; // 低音弦→高音弦
  strings: number[]; // 低音弦→高音弦の弦番号
  tones: number[]; // 各音の root からの半音
}

// あるコード（quality + rootNote）と弦グループで、すべてのインバージョンの
// フレット位置を計算する。各インバージョンはネック上での「最も自然な低位置」に配置。
// （ベース音は最低 0 フレット以上、各音が上昇するピッチで並ぶ）
export function computeInversions(
  quality: ChordQuality,
  rootNote: string,
  group: StringGroup,
): InversionForm[] {
  const numInversions = QUALITY_TONES[quality].length; // 3 or 4
  const rootIdx = noteIndex(rootNote);
  const forms: InversionForm[] = [];

  for (let k = 0; k < numInversions; k++) {
    const tones = inversionTones(quality, k);
    const frets: number[] = [];
    let prevPitch = -Infinity;
    for (let i = 0; i < group.strings.length; i++) {
      const stringNum = group.strings[i];
      const openPitch = STRING_OPEN_PITCH[stringNum];
      const openClass = openPitch % 12;
      const targetClass = (tones[i] + rootIdx) % 12;
      let fret = (((targetClass - openClass) % 12) + 12) % 12;
      let pitch = openPitch + fret;
      // 上昇するピッチを保つためフレットを 12 ずつ上げる
      while (pitch <= prevPitch) {
        fret += 12;
        pitch += 12;
      }
      frets.push(fret);
      prevPitch = pitch;
    }
    forms.push({ inversion: k, frets, strings: group.strings, tones });
  }

  return forms;
}

// フレットボードに表示する用に、可視範囲(0..maxFret)内のフォームを集める。
// 同じインバージョンでもオクターブ違い（+12/−12）でフィットすれば追加する。
export function visibleForms(
  forms: InversionForm[],
  maxFret = 15,
): InversionForm[] {
  const out: InversionForm[] = [];
  for (const f of forms) {
    // 元のフォームから -12 オクターブまで降りていき、最低でフィットする位置を探す
    let baseFrets = [...f.frets];
    while (Math.min(...baseFrets) - 12 >= 0) {
      baseFrets = baseFrets.map((x) => x - 12);
    }
    // baseFrets から +12 オクターブずつ可視範囲に収まる限り追加
    let frets = baseFrets;
    while (Math.max(...frets) <= maxFret) {
      out.push({ ...f, frets: [...frets] });
      frets = frets.map((x) => x + 12);
    }
  }
  return out;
}
