import { useMemo, useState } from "react";
import { Sparkles, Wind } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import {
  analyzeEmotionRequest,
  formatShortDate,
  loadEmotionData,
  saveEmotionAnalysis,
  useSociovaQuery,
} from "@/lib/sociova-data";
import { useAuth } from "@/lib/auth";


export function EmotionPage() {
  const { role } = useAuth();
  const { data, loading, error, refetch } = useSociovaQuery(loadEmotionData);
  const [text, setText] = useState("Aku tidak mau pergi ke sekolah besok. Perutku terasa aneh.");
  const [result, setResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const next = await analyzeEmotionRequest(text);
      setResult(next);
      await saveEmotionAnalysis({
        input_text: text,
        detected_emotion: next.label,
        confidence: next.confidence,
        recommendation: next.rec,
      });
      toast.success("Hasil analisis emosi disimpan");
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

  const trend = useMemo(() => {
    const logs = data?.logs ?? [];
    const map = new Map<string, number>();
    for (const log of logs) {
      const key = log.detected_emotion || "Lainnya";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }, [data]);

  if (loading) return <StateCard title="Loading emotion logs" description="Memuat catatan emosi." />;
  if (error) return <StateCard title="Emotion data unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title={role === "therapist" ? "Emotion Trends" : "Emotion Analyzer"}
        description={
          role === "therapist"
            ? "Pantau tren emosi klien dan simulasikan analisis teks terbaru."
            : "Kenali perasaan dari tulisan dan dapatkan langkah sederhana untuk menenangkan diri."
        }
      />

      {role === "therapist" && trend.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trend.map((item) => (
            <Card key={item.label} className="rounded-2xl border-border/60 bg-card/60 p-4">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="mt-1 font-display text-2xl font-bold">{item.count}</div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="rounded-xl"
            placeholder="Ceritakan perasaanmu hari ini..."
          />
          <Button onClick={analyze} disabled={analyzing || !text.trim()} className="mt-4 rounded-full btn-brand border-0">
            <Sparkles className="mr-2 h-4 w-4" /> {analyzing ? "Menganalisis..." : "Analyze"}
          </Button>
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/40 py-8">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[color:var(--brand)]/25 blur-2xl animate-breath" />
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[color:var(--brand-glow)] to-[color:var(--brand)] shadow-[0_20px_60px_-15px_color-mix(in_oklab,var(--brand)_60%,transparent)] animate-breath" />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Breathe with the circle · Tarik napas pelan bersama Sova</div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          {result ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Detected emotion</div>
                <div className="mt-1 font-display text-3xl font-bold">{result.label}</div>
                <div className="text-sm text-muted-foreground">Confidence {result.confidence}%</div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.rec}</p>
              <div className="space-y-2">
                {emotions.map((item: any) => (
                  <div key={item.l}>
                    <div className="mb-1 flex justify-between text-xs"><span>{item.l}</span><span>{item.v}%</span></div>
                    <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full" style={{ width: `${item.v}%`, background: item.c }} /></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Wind className="mb-3 h-8 w-8" />
              Hasil analisis akan muncul di sini.
            </div>
          )}
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Riwayat emosi</h2>
        <div className="mt-4 space-y-3">
          {(data?.logs ?? []).map((log: any, index: number) => (
            <div key={`${log.created_at}-${index}`} className="rounded-xl border border-border/60 bg-background/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{log.detected_emotion}</div>
                <div className="text-xs text-muted-foreground">{log.created_at ? formatShortDate(log.created_at) : "-"}</div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{log.input_text}</p>
            </div>
          ))}
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

