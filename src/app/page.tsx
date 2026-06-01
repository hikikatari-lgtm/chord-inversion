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
import ChordDiagram from "@/components/ChordDiagram";
import {
  PRESETS,
  parseProgression,
  inferFamily,
  type ChordRef,
} from "@/lib/progressions";
import { chooseVoiceLeading } from "@/lib/voice-leading";

type Family = "triad" | "drop2";
type TopMode = "map" | "progression";

export default function Home() {
  const [topMode, setTopMode] = useState<TopMode>("map");
  const [family, setFamily] = useState<Family>("triad");
  const [triadQ, setTriadQ] = useState<TriadQuality>("maj");
  const [drop2Q, setDrop2Q] = useState<SeventhQuality>("maj7");
  const [triadGroupId, setTriadGroupId] = useState<string>("1-3");
  const [drop2GroupId, setDrop2GroupId] = useState<string>("1-4");
  const [rootNote, setRootNote] = useState<string>("C");
  const [display, setDisplay] = useState<"degree" | "note">("degree");

  // 進行モード用
  const [presetId, setPresetId] = useState<string>("2-5-1");
  const [progressionText, setProgressionText] = useState<string>("");
  const [startInversion, setStartInversion] = useState<number>(0);

  const groups = family === "triad" ? TRIAD_GROUPS : DROP2_GROUPS;
  const groupId = family === "triad" ? triadGroupId : drop2GroupId;
  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  // 転回マップ用
  const mapQuality: ChordQuality = family === "triad" ? triadQ : drop2Q;
  const mapForms = useMemo(
    () => computeInversions(mapQuality, rootNote, group),
    [mapQuality, rootNote, group],
  );
  const mapChordSymbol = `${rootNote}${QUALITY_SUFFIX[mapQuality]}`;
  const qualities: ChordQuality[] =
    family === "triad" ? TRIAD_QUALITIES : SEVENTH_QUALITIES;

  // 進行モード用：プリセット or テキスト入力からコード列を決定
  const progressionChords: ChordRef[] = useMemo(() => {
    if (progressionText.trim()) {
      return parseProgression(progressionText);
    }
    const preset = PRESETS.find((p) => p.id === presetId);
    return preset ? preset.chords : [];
  }, [progressionText, presetId]);

  // 進行内のクオリティから family を自動判定（手動切替も可能）
  const [progressionFamilyManual, setProgressionFamilyManual] =
    useState<Family | null>(null);
  const effectiveProgFamily: Family =
    progressionFamilyManual ?? inferFamily(progressionChords);
  const progGroups =
    effectiveProgFamily === "triad" ? TRIAD_GROUPS : DROP2_GROUPS;
  const [progGroupId, setProgGroupId] = useState<string>("1-4");
  const progGroup =
    progGroups.find((g) => g.id === progGroupId) ?? progGroups[0];

  const progressionForms = useMemo(
    () => chooseVoiceLeading(progressionChords, progGroup, startInversion),
    [progressionChords, progGroup, startInversion],
  );

  const numStartInversions =
    effectiveProgFamily === "triad" ? 3 : 4;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-amber-400">
        🎸 Chord-Inversion
      </h1>
      <p className="mb-6 text-xs text-neutral-500">
        トライアド転回型 / Drop2 ボイシングをフレットボード上で形と度数で見る
      </p>

      {/* トップモード切替 */}
      <div className="mb-4">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
          モード
        </div>
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-[3px]">
          {(["map", "progression"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTopMode(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                topMode === m
                  ? "bg-amber-400 text-black"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {m === "map" ? "転回マップ" : "進行（声部移動）"}
            </button>
          ))}
        </div>
      </div>

      {topMode === "map" ? (
        <MapMode
          family={family}
          setFamily={setFamily}
          qualities={qualities}
          quality={mapQuality}
          setTriadQ={setTriadQ}
          setDrop2Q={setDrop2Q}
          groups={groups}
          groupId={groupId}
          setTriadGroupId={setTriadGroupId}
          setDrop2GroupId={setDrop2GroupId}
          rootNote={rootNote}
          setRootNote={setRootNote}
          display={display}
          setDisplay={setDisplay}
          chordSymbol={mapChordSymbol}
          forms={mapForms}
        />
      ) : (
        <ProgressionMode
          presetId={presetId}
          setPresetId={setPresetId}
          progressionText={progressionText}
          setProgressionText={setProgressionText}
          chords={progressionChords}
          family={effectiveProgFamily}
          setFamily={(f) => setProgressionFamilyManual(f)}
          progGroups={progGroups}
          progGroupId={progGroupId}
          setProgGroupId={setProgGroupId}
          startInversion={startInversion}
          setStartInversion={setStartInversion}
          numStartInversions={numStartInversions}
          display={display}
          setDisplay={setDisplay}
          forms={progressionForms}
        />
      )}
    </div>
  );
}

// ─────────── 転回マップ（既存） ───────────

function MapMode(props: {
  family: Family;
  setFamily: (f: Family) => void;
  qualities: ChordQuality[];
  quality: ChordQuality;
  setTriadQ: (q: TriadQuality) => void;
  setDrop2Q: (q: SeventhQuality) => void;
  groups: { id: string; label: string }[];
  groupId: string;
  setTriadGroupId: (id: string) => void;
  setDrop2GroupId: (id: string) => void;
  rootNote: string;
  setRootNote: (n: string) => void;
  display: "degree" | "note";
  setDisplay: (d: "degree" | "note") => void;
  chordSymbol: string;
  forms: ReturnType<typeof computeInversions>;
}) {
  const {
    family,
    setFamily,
    qualities,
    quality,
    setTriadQ,
    setDrop2Q,
    groups,
    groupId,
    setTriadGroupId,
    setDrop2GroupId,
    rootNote,
    setRootNote,
    display,
    setDisplay,
    chordSymbol,
    forms,
  } = props;
  return (
    <>
      <SectionLabel>カテゴリ</SectionLabel>
      <SegBtns>
        {(["triad", "drop2"] as const).map((f) => (
          <SegBtn
            key={f}
            active={family === f}
            onClick={() => setFamily(f)}
          >
            {f === "triad" ? "トライアド (3音)" : "Drop 2 (4音)"}
          </SegBtn>
        ))}
      </SegBtns>

      <SectionLabel>コードクオリティ</SectionLabel>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {qualities.map((q) => (
          <Chip
            key={q}
            active={quality === q}
            onClick={() =>
              family === "triad"
                ? setTriadQ(q as TriadQuality)
                : setDrop2Q(q as SeventhQuality)
            }
          >
            {QUALITY_LABEL[q]}
          </Chip>
        ))}
      </div>

      <SectionLabel>使用する弦グループ</SectionLabel>
      <SegBtns>
        {groups.map((g) => (
          <SegBtn
            key={g.id}
            active={groupId === g.id}
            onClick={() =>
              family === "triad"
                ? setTriadGroupId(g.id)
                : setDrop2GroupId(g.id)
            }
          >
            {g.label}
          </SegBtn>
        ))}
      </SegBtns>

      <SectionLabel>ルート音</SectionLabel>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ALL_ROOTS.map((r) => (
          <RootBtn
            key={r}
            active={rootNote === r}
            onClick={() => setRootNote(r)}
          >
            {r}
          </RootBtn>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-mono text-3xl font-bold leading-none text-amber-400">
          {chordSymbol}
        </div>
        <DisplayToggle display={display} setDisplay={setDisplay} />
      </div>

      <Fretboard
        forms={forms}
        quality={quality}
        rootNote={rootNote}
        display={display}
      />

      <Legend hasInv3={forms.some((f) => f.inversion === 3)} />
    </>
  );
}

// ─────────── 進行（声部移動） ───────────

function ProgressionMode(props: {
  presetId: string;
  setPresetId: (id: string) => void;
  progressionText: string;
  setProgressionText: (s: string) => void;
  chords: ChordRef[];
  family: Family;
  setFamily: (f: Family) => void;
  progGroups: { id: string; label: string }[];
  progGroupId: string;
  setProgGroupId: (id: string) => void;
  startInversion: number;
  setStartInversion: (n: number) => void;
  numStartInversions: number;
  display: "degree" | "note";
  setDisplay: (d: "degree" | "note") => void;
  forms: ReturnType<typeof chooseVoiceLeading>;
}) {
  const {
    presetId,
    setPresetId,
    progressionText,
    setProgressionText,
    chords,
    family,
    setFamily,
    progGroups,
    progGroupId,
    setProgGroupId,
    startInversion,
    setStartInversion,
    numStartInversions,
    display,
    setDisplay,
    forms,
  } = props;

  return (
    <>
      <SectionLabel>プリセット</SectionLabel>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Chip
            key={p.id}
            active={presetId === p.id && !progressionText.trim()}
            onClick={() => {
              setPresetId(p.id);
              setProgressionText("");
            }}
          >
            {p.label}
          </Chip>
        ))}
      </div>

      <SectionLabel>カスタム進行（スペース区切り：例 Dm7 G7 CM7）</SectionLabel>
      <input
        type="text"
        value={progressionText}
        onChange={(e) => setProgressionText(e.target.value)}
        placeholder="Dm7 G7 CM7"
        className="mb-3 w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-amber-400 focus:outline-none"
      />

      <SectionLabel>カテゴリ</SectionLabel>
      <SegBtns>
        {(["triad", "drop2"] as const).map((f) => (
          <SegBtn key={f} active={family === f} onClick={() => setFamily(f)}>
            {f === "triad" ? "トライアド (3音)" : "Drop 2 (4音)"}
          </SegBtn>
        ))}
      </SegBtns>

      <SectionLabel>使用する弦グループ</SectionLabel>
      <SegBtns>
        {progGroups.map((g) => (
          <SegBtn
            key={g.id}
            active={progGroupId === g.id}
            onClick={() => setProgGroupId(g.id)}
          >
            {g.label}
          </SegBtn>
        ))}
      </SegBtns>

      <SectionLabel>開始転回（1コード目のフォーム）</SectionLabel>
      <SegBtns>
        {Array.from({ length: numStartInversions }, (_, i) => i).map((i) => (
          <SegBtn
            key={i}
            active={startInversion === i}
            onClick={() => setStartInversion(i)}
          >
            {i === 0 ? "基本型" : i === 1 ? "第1転回" : i === 2 ? "第2転回" : "第3転回"}
          </SegBtn>
        ))}
      </SegBtns>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-mono text-sm text-neutral-400">
          {chords.length === 0
            ? "進行を入力するかプリセットを選択してください"
            : `${chords.map((c) => `${c.root}${QUALITY_SUFFIX[c.quality]}`).join(" → ")}`}
        </div>
        <DisplayToggle display={display} setDisplay={setDisplay} />
      </div>

      {/* 進行: 横並びのコードダイアグラム */}
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        {forms.length === 0 ? (
          <div className="text-sm text-neutral-500">
            このコード進行・カテゴリ・弦グループの組み合わせでフォームを表示できません
          </div>
        ) : (
          forms.map((f, i) => (
            <ChordDiagram
              key={i}
              form={f}
              quality={chords[i].quality}
              rootNote={chords[i].root}
              display={display}
              title={`${chords[i].root}${QUALITY_SUFFIX[chords[i].quality]}`}
            />
          ))
        )}
      </div>

      <div className="mt-3 text-[10px] text-neutral-500">
        <span className="text-amber-400">●</span> ルート &nbsp;
        <span className="text-green-400">●</span> その他のコードトーン &nbsp;
        — 直前のコードから声部移動が最小になる転回を自動選択しています
      </div>
    </>
  );
}

// ─────────── 小物コンポーネント ───────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
      {children}
    </div>
  );
}

function SegBtns({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-[3px]">
      {children}
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-amber-400 text-black"
          : "text-neutral-400 hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-amber-400 bg-amber-400/20 text-amber-400"
          : "border-neutral-700 text-neutral-300 hover:border-amber-400/60"
      }`}
    >
      {children}
    </button>
  );
}

function RootBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
        active
          ? "border-amber-400 bg-amber-400 text-black"
          : "border-neutral-700 text-neutral-200 hover:border-amber-400/60"
      }`}
    >
      {children}
    </button>
  );
}

function DisplayToggle({
  display,
  setDisplay,
}: {
  display: "degree" | "note";
  setDisplay: (d: "degree" | "note") => void;
}) {
  return (
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
  );
}

function Legend({ hasInv3 }: { hasInv3: boolean }) {
  return (
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
      {hasInv3 ? (
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "hsl(286 70% 55%)" }}
          />
          第3転回
        </span>
      ) : null}
    </div>
  );
}
