"use client";

import { useMemo, useState } from "react";
import {
  ALL_ROOTS,
  QUALITY_LABEL,
  QUALITY_SUFFIX,
  TRIAD_QUALITIES,
  SEVENTH_QUALITIES,
  type ChordQuality,
  type TriadQuality,
  type SeventhQuality,
} from "@/lib/music";
import {
  TRIAD_GROUPS,
  DROP2_GROUPS,
  computeInversions,
} from "@/lib/inversions";
import Fretboard from "@/components/Fretboard";

type Mode = "triad" | "drop2";

export default function Home() {
  const [mode, setMode] = useState<Mode>("triad");
  const [triadQ, setTriadQ] = useState<TriadQuality>("maj");
  const [drop2Q, setDrop2Q] = useState<SeventhQuality>("maj7");
  const [triadGroupId, setTriadGroupId] = useState<string>("1-3");
  const [drop2GroupId, setDrop2GroupId] = useState<string>("1-4");
  const [rootNote, setRootNote] = useState<string>("C");
  const [display, setDisplay] = useState<"degree" | "note">("degree");

  const quality: ChordQuality = mode === "triad" ? triadQ : drop2Q;
  const groups = mode === "triad" ? TRIAD_GROUPS : DROP2_GROUPS;
  const groupId = mode === "triad" ? triadGroupId : drop2GroupId;
  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  const forms = useMemo(
    () => computeInversions(quality, rootNote, group),
    [quality, rootNote, group],
  );

  const chordSymbol = `${rootNote}${QUALITY_SUFFIX[quality]}`;
  const qualities: ChordQuality[] =
    mode === "triad" ? TRIAD_QUALITIES : SEVENTH_QUALITIES;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-amber-400">
        🎸 Chord-Inversion
      </h1>
      <p className="mb-6 text-xs text-neutral-500">
        トライアド転回型 / Drop2 ボイシングをフレットボード上で形と度数で見る
      </p>

      {/* モード切替 */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
          モード
        </div>
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-[3px]">
          {(["triad", "drop2"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m
                  ? "bg-amber-400 text-black"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {m === "triad" ? "トライアド (3音)" : "Drop 2 (4音)"}
            </button>
          ))}
        </div>
      </div>

      {/* クオリティ */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
          コードクオリティ
        </div>
        <div className="flex flex-wrap gap-1.5">
          {qualities.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() =>
                mode === "triad"
                  ? setTriadQ(q as TriadQuality)
                  : setDrop2Q(q as SeventhQuality)
              }
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                quality === q
                  ? "border-amber-400 bg-amber-400/20 text-amber-400"
                  : "border-neutral-700 text-neutral-300 hover:border-amber-400/60"
              }`}
            >
              {QUALITY_LABEL[q]}
            </button>
          ))}
        </div>
      </div>

      {/* 弦グループ */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
          使用する弦グループ
        </div>
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-[3px]">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() =>
                mode === "triad"
                  ? setTriadGroupId(g.id)
                  : setDrop2GroupId(g.id)
              }
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                groupId === g.id
                  ? "bg-amber-400 text-black"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* ルート音 */}
      <div className="mb-4">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
          ルート音
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ROOTS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRootNote(r)}
              className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                rootNote === r
                  ? "border-amber-400 bg-amber-400 text-black"
                  : "border-neutral-700 text-neutral-200 hover:border-amber-400/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 現在のコード + 表示モード */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-mono text-3xl font-bold leading-none text-amber-400">
          {chordSymbol}
        </div>
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-[3px]">
          <button
            type="button"
            onClick={() => setDisplay("degree")}
            className={`rounded-md px-2.5 py-1 text-[11px] transition-colors ${
              display === "degree"
                ? "bg-amber-400 text-black"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            度数
          </button>
          <button
            type="button"
            onClick={() => setDisplay("note")}
            className={`rounded-md px-2.5 py-1 text-[11px] transition-colors ${
              display === "note"
                ? "bg-amber-400 text-black"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            音名
          </button>
        </div>
      </div>

      <Fretboard
        forms={forms}
        quality={quality}
        rootNote={rootNote}
        display={display}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-neutral-500">
        <span>
          <span className="text-amber-400">●</span> ルート
        </span>
        <span className="ml-1">転回ごとに色相を変えて表示:</span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "hsl(38 70% 55%)" }}
          />
          基本型
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "hsl(142 70% 55%)" }}
          />
          第1転回
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "hsl(196 70% 55%)" }}
          />
          第2転回
        </span>
        {forms.some((f) => f.inversion === 3) ? (
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "hsl(286 70% 55%)" }}
            />
            第3転回
          </span>
        ) : null}
      </div>
    </div>
  );
}
