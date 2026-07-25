import { useEffect, useState } from "react";
import { Sova } from "@/components/site/sova";
import { cn } from "@/lib/utils";

export type SovaLessonKind =
  | "neutral"
  | "conversation"
  | "breathing"
  | "emotions"
  | "story"
  | "sensory";

const CONVO_STEPS = [
  { who: "sova" as const, text: "Halo! Aku Sova. Siapa namamu?" },
  { who: "child" as const, text: "Namaku Bimo." },
  { who: "sova" as const, text: "Senang bertemu, Bimo. Boleh main bareng?" },
  { who: "child" as const, text: "Boleh. Aku suka balok." },
  { who: "sova" as const, text: "Bagus! Mari kita main pelan-pelan." },
];

const BREATH_LABELS = ["Tarik napas… 1 2 3 4", "Tahan… 1 2 3 4", "Hembus… 1 2 3 4"];

export function SovaLessonAnimation({
  kind,
  className,
}: {
  kind: SovaLessonKind;
  className?: string;
}) {
  if (kind === "conversation") return <ConversationScene className={className} />;
  if (kind === "breathing") return <BreathingScene className={className} />;
  if (kind === "emotions") return <EmotionsScene className={className} />;
  if (kind === "story") return <StoryScene className={className} />;
  if (kind === "sensory") return <SensoryScene className={className} />;
  return <NeutralScene className={className} />;
}

function SceneShell({
  className,
  children,
  caption,
}: {
  className?: string;
  children: React.ReactNode;
  caption: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-[color:var(--brand)]/15 via-background/40 to-background/80 p-4 sm:p-5",
        className,
      )}
    >
      <div className="relative min-h-[220px] sm:min-h-[260px]">{children}</div>
      <p className="mt-3 text-center text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function NeutralScene({ className }: { className?: string }) {
  const tips = [
    "Halo, aku Sova. Yuk belajar pelan-pelan.",
    "Tarik napas… hembus pelan. Kamu hebat.",
    "Satu langkah kecil hari ini sudah cukup.",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % tips.length), 3200);
    return () => window.clearInterval(id);
  }, [tips.length]);

  return (
    <SceneShell className={className} caption="Animasi Sova">
      <div className="flex h-full flex-col items-center justify-center gap-4 py-4">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-[color:var(--brand)]/20 blur-xl animate-pulse" />
          <Sova size={100} float />
        </div>
        <div className="max-w-sm rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-center text-sm shadow-sm animate-in fade-in">
          {tips[i]}
        </div>
        <div className="flex gap-1.5">
          {tips.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                idx === i ? "bg-[color:var(--brand)]" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>
    </SceneShell>
  );
}

function ConversationScene({ className }: { className?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % CONVO_STEPS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  const current = CONVO_STEPS[step];
  const visible = CONVO_STEPS.slice(0, step + 1).slice(-3);

  return (
    <SceneShell className={className} caption="Animasi Sova · Latihan percakapan tenang">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <Sova size={88} float />
          <div className="flex flex-1 flex-col gap-2">
            {visible.map((msg, i) => (
              <div
                key={`${msg.text}-${i}`}
                className={cn(
                  "max-w-[92%] rounded-2xl px-3 py-2 text-sm shadow-sm animate-in fade-in slide-in-from-bottom-2",
                  msg.who === "sova"
                    ? "self-start rounded-bl-sm border border-border/60 bg-card/90"
                    : "self-end rounded-br-sm btn-brand border-0 text-[color:var(--brand-foreground)]",
                )}
              >
                {msg.text}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-center text-xs text-muted-foreground">
          Langkah {step + 1}/{CONVO_STEPS.length}: {current.who === "sova" ? "Sova bicara" : "Anak menjawab"}
        </div>
      </div>
    </SceneShell>
  );
}

function BreathingScene({ className }: { className?: string }) {
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(1);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setCount((c) => {
        if (c >= 4) {
          setPhase((p) => (p + 1) % 3);
          return 1;
        }
        return c + 1;
      });
    }, 900);
    return () => window.clearInterval(tick);
  }, []);

  const scale = phase === 0 ? 1 + count * 0.08 : phase === 1 ? 1.32 : 1.32 - count * 0.08;

  return (
    <SceneShell className={className} caption="Animasi Sova · Latihan napas 4-4-4">
      <div className="flex h-full flex-col items-center justify-center gap-5 py-2">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <div
            className="absolute rounded-full bg-[color:var(--brand)]/25 blur-md transition-transform duration-700 ease-in-out"
            style={{ width: 140, height: 140, transform: `scale(${scale})` }}
          />
          <div
            className="absolute rounded-full border-2 border-[color:var(--brand)]/50 transition-transform duration-700 ease-in-out"
            style={{ width: 120, height: 120, transform: `scale(${scale})` }}
          />
          <Sova size={72} float={false} />
        </div>
        <div className="text-center">
          <div className="font-display text-lg font-bold text-foreground">{BREATH_LABELS[phase]}</div>
          <div className="mt-1 font-display text-3xl font-bold text-[color:var(--brand)]">{count}</div>
        </div>
      </div>
    </SceneShell>
  );
}

function EmotionsScene({ className }: { className?: string }) {
  const faces = [
    { label: "Senang", color: "bg-amber-400/30 border-amber-400/50" },
    { label: "Tenang", color: "bg-sky-400/30 border-sky-400/50" },
    { label: "Sedih", color: "bg-blue-500/25 border-blue-400/40" },
    { label: "Marah", color: "bg-rose-400/25 border-rose-400/40" },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIdx((i) => (i + 1) % faces.length), 2200);
    return () => window.clearInterval(id);
  }, [faces.length]);

  return (
    <SceneShell className={className} caption="Animasi Sova · Mengenali emosi">
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Sova size={80} />
        <div className="grid w-full max-w-sm grid-cols-4 gap-2">
          {faces.map((f, i) => (
            <div
              key={f.label}
              className={cn(
                "rounded-xl border px-1 py-3 text-center text-[11px] font-medium transition-all",
                f.color,
                i === idx ? "scale-110 ring-2 ring-[color:var(--brand)]" : "opacity-60",
              )}
            >
              {f.label}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Sova: “Hari ini aku merasa <strong className="text-foreground">{faces[idx].label}</strong>.”
        </p>
      </div>
    </SceneShell>
  );
}

function StoryScene({ className }: { className?: string }) {
  const lines = [
    "Besok aku ke sekolah baru.",
    "Aku boleh merasa gugup.",
    "Aku tarik napas dan tersenyum.",
    "Teman baru bisa menyapaku.",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % lines.length), 2500);
    return () => window.clearInterval(id);
  }, [lines.length]);

  return (
    <SceneShell className={className} caption="Animasi Sova · Social story">
      <div className="flex h-full items-center gap-4">
        <Sova size={90} />
        <div className="flex-1 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Cerita sosial</div>
          <p className="mt-2 font-display text-lg font-semibold text-foreground animate-in fade-in">
            {lines[i]}
          </p>
          <div className="mt-3 flex gap-1.5">
            {lines.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  idx <= i ? "bg-[color:var(--brand)]" : "bg-border",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function SensoryScene({ className }: { className?: string }) {
  return (
    <SceneShell className={className} caption="Animasi Sova · Ruang tenang">
      <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-6 top-4 h-10 w-10 rounded-full bg-[color:var(--brand)]/30 animate-pulse" />
          <div className="absolute right-10 top-10 h-6 w-6 rounded-full bg-[color:var(--brand-glow)]/40 animate-pulse" />
          <div className="absolute bottom-8 left-1/3 h-8 w-8 rounded-full bg-sky-400/20 animate-pulse" />
        </div>
        <Sova size={96} />
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          Saat terlalu ramai, Sova mencari tempat tenang sebentar, lalu siap kembali bermain.
        </p>
      </div>
    </SceneShell>
  );
}
