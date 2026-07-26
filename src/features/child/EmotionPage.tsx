import { useState } from "react";
import { Angry, Frown, Meh, Smile, Sparkles, Wind, Heart } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import { Sova, SovaBubble } from "@/components/site/sova";
import {
  analyzeEmotionRequest,
  formatShortDate,
  loadEmotionData,
  saveEmotionAnalysis,
  useSociovaQuery,
} from "@/lib/sociova-data";
import { EMOTION_FACES, type EmotionFace } from "@/lib/child-game";
import { cn } from "@/lib/utils";

const FACE_ICONS = {
  smile: Smile,
  meh: Meh,
  frown: Frown,
  angry: Angry,
  heart: Heart,
} as const;

export function EmotionPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadEmotionData);
  const [selected, setSelected] = useState<EmotionFace | null>(null);
  const [text, setText] = useState("");
  const [showType, setShowType] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reward, setReward] = useState<{ xp?: number; coins?: number; badges?: any[] } | null>(
    null,
  );

  const submitFace = async (face: EmotionFace) => {
    setSelected(face);
    setAnalyzing(true);
    setReward(null);
    try {
      const next = await analyzeEmotionRequest(face.prompt);
      setResult(next);
      const saved = await saveEmotionAnalysis({
        input_text: face.prompt,
        detected_emotion: next.label,
        confidence: next.confidence,
        recommendation: next.rec,
        scores: next.scores,
        mission_step: true,
        xp: 30,
      });
      setReward({
        xp: saved.xpGained,
        coins: saved.coins,
        badges: saved.newBadges,
      });
      toast.success(`+${saved.xpGained ?? 30} XP · ${face.label}`);
      if (saved.newBadges?.length) {
        toast.success(`Badge: ${saved.newBadges.map((b: any) => b.name).join(", ")}`);
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeText = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setReward(null);
    try {
      const next = await analyzeEmotionRequest(text);
      setResult(next);
      const saved = await saveEmotionAnalysis({
        input_text: text,
        detected_emotion: next.label,
        confidence: next.confidence,
        recommendation: next.rec,
        mission_step: true,
        xp: 35,
      });
      setReward({
        xp: saved.xpGained,
        coins: saved.coins,
        badges: saved.newBadges,
      });
      toast.success(`+${saved.xpGained ?? 35} XP`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analisis gagal");
    } finally {
      setAnalyzing(false);
    }
  };

  const emotions = result?.scores ?? [
    { l: "Cemas", v: 0, c: "var(--warning)" },
    { l: "Sedih", v: 0, c: "var(--brand)" },
    { l: "Tenang", v: 0, c: "var(--success)" },
    { l: "Marah", v: 0, c: "var(--destructive)" },
  ];

  if (loading) return <StateCard title="Sedang memuat" description="Memuat catatan emosi." />;
  if (error) return <StateCard title="Belum bisa dibuka" description={error} />;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Latihan Emosi"
        description="Kenali perasaan dengan mengetuk wajah — mengetik opsional."
      />

      <SovaBubble
        message={
          selected
            ? `Kamu memilih ${selected.label}. Bagus sekali!`
            : "Halo! Pilih wajah yang paling mirip perasaanmu sekarang."
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="mb-3 text-sm font-semibold">Pilih perasaanmu</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {EMOTION_FACES.map((face) => {
              const Icon = FACE_ICONS[face.icon] ?? Smile;
              return (
                <button
                  key={face.id}
                  type="button"
                  disabled={analyzing}
                  onClick={() => submitFace(face)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-95",
                    selected?.id === face.id
                      ? "border-[color:var(--brand)] bg-[color:var(--brand)]/10 shadow-md"
                      : "border-border/60 bg-background/40 hover:border-[color:var(--brand)]/40 hover:-translate-y-0.5",
                  )}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: `color-mix(in oklab, ${face.color} 18%, transparent)`, color: face.color }}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="text-sm font-semibold">{face.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/40 py-6">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[color:var(--brand)]/25 blur-2xl animate-breath" />
              <Sova size={88} float glow />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Tarik napas pelan bersama Sova
            </div>
          </div>

          <button
            type="button"
            className="mt-4 text-xs text-muted-foreground underline"
            onClick={() => setShowType((v) => !v)}
          >
            {showType ? "Sembunyikan ketik (opsional)" : "Mau cerita dengan kata? (opsional)"}
          </button>
          {showType && (
            <div className="mt-3 space-y-3">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="rounded-xl"
                placeholder="Ceritakan perasaanmu..."
              />
              <Button
                onClick={analyzeText}
                disabled={analyzing || !text.trim()}
                className="rounded-full btn-brand border-0"
              >
                <Sparkles className="mr-2 h-4 w-4" /> {analyzing ? "Menganalisis..." : "Analyze"}
              </Button>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sova size={56} float={false} />
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Detected emotion</div>
                  <div className="font-display text-3xl font-bold">{result.label}</div>
                  <div className="text-sm text-muted-foreground">Confidence {result.confidence}%</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.rec}</p>
              {reward && (
                <div className="rounded-xl border border-[color:var(--brand)]/30 bg-[color:var(--brand)]/10 px-3 py-2 text-sm font-medium">
                  +{reward.xp ?? 0} XP
                  {reward.coins != null ? ` · ${reward.coins} coins` : ""}
                </div>
              )}
              <div className="space-y-2">
                {emotions.map((item: any) => (
                  <div key={item.l}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{item.l}</span>
                      <span>{item.v}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${item.v}%`, background: item.c }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Wind className="mb-3 h-8 w-8" />
              Ketuk satu wajah di kiri. Hasil muncul di sini.
            </div>
          )}
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Riwayat emosi</h2>
        <div className="mt-4 space-y-3">
          {(data?.logs ?? []).map((log: any, index: number) => (
            <div
              key={`${log.created_at}-${index}`}
              className="rounded-xl border border-border/60 bg-background/30 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{log.detected_emotion}</div>
                <div className="text-xs text-muted-foreground">
                  {log.created_at ? formatShortDate(log.created_at) : "-"}
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{log.input_text}</p>
            </div>
          ))}
          {!data?.logs?.length && (
            <p className="text-sm text-muted-foreground">Belum ada catatan. Yuk pilih wajah dulu.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
