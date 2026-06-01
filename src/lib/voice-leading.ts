// コード進行に対し、声部移動が最小になる転回を順に選んでいく

import { STRING_OPEN_PITCH } from "@/lib/music";
import { computeInversions, type InversionForm, type StringGroup } from "@/lib/inversions";
import type { ChordRef } from "@/lib/progressions";

function pitchesOf(form: InversionForm): number[] {
  return form.strings.map((s, i) => STRING_OPEN_PITCH[s] + form.frets[i]);
}

// 各弦のピッチ差の絶対値合計（同じ index 同士で対応させる）
function voiceDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

// 与えられた進行に対し、1つ目のコードは startInversion で固定、
// 以降は直前の form から声部移動が最小のものを選ぶ。
export function chooseVoiceLeading(
  chords: ChordRef[],
  group: StringGroup,
  startInversion: number,
): InversionForm[] {
  if (chords.length === 0) return [];
  const result: InversionForm[] = [];

  // 1つ目のコード: startInversion を持つフォームの中で最も低い位置のものを採用
  const firstForms = computeInversions(
    chords[0].quality,
    chords[0].root,
    group,
  ).filter((f) => f.inversion === startInversion);
  if (firstForms.length === 0) {
    // 指定インバージョンが無ければ、利用可能な最初のもの
    const any = computeInversions(chords[0].quality, chords[0].root, group);
    if (any.length === 0) return [];
    result.push(any[0]);
  } else {
    // フレット位置が最も低いものを採用
    result.push(
      firstForms.reduce((a, b) =>
        Math.min(...a.frets) <= Math.min(...b.frets) ? a : b,
      ),
    );
  }

  // 2つ目以降: 直前の form から voice distance 最小のものを選ぶ
  for (let i = 1; i < chords.length; i++) {
    const c = chords[i];
    const candidates = computeInversions(c.quality, c.root, group);
    if (candidates.length === 0) break;
    const prevPitches = pitchesOf(result[i - 1]);
    let best = candidates[0];
    let bestDist = Infinity;
    for (const cand of candidates) {
      const dist = voiceDistance(prevPitches, pitchesOf(cand));
      if (dist < bestDist) {
        bestDist = dist;
        best = cand;
      }
    }
    result.push(best);
  }

  return result;
}
