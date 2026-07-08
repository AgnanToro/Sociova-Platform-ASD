import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Wind } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import {
  loadEmotionData,
  saveEmotionAnalysis,
  useSociovaQuery,
  formatShortDate,
} from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/emotion")({ component: EmotionPage });

function EmotionPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadEmotionData);
  const [text, setText] = useState("Aku tidak mau pergi ke sekolah besok. Perutku terasa aneh.");
  const [result, setResult] = useState<{ label: string; confidence: number; rec: string } | null>({
    label: "Cemas",
    confidence: 84,
    rec: "Kamu terlihat sedang merasa cemas. Yuk coba tarik napas pelan selama 4 detik. Tahan selama 4 detik. Lalu hembuskan perlahan. Setelah itu, peluk boneka atau benda kesukaanmu agar tubuh terasa lebih tenang. 💙",
  });

  const analyze = async () => {
    const next = {
      label: "Cemas",
      confidence: 84,
      rec: "Kamu terlihat sedang merasa cemas. Yuk coba tarik napas pelan selama 4 detik. Tahan selama 4 detik. Lalu hembuskan perlahan. Setelah itu, peluk boneka atau benda kesukaanmu agar tubuh terasa lebih tenang. 💙",
    };
    setResult(next);
    try {
      await saveEmotionAnalysis({
        input_text: text,
        detected_emotion: next.label,
        confidence: next.confidence,
        recommendation: next.rec,
      });
      toast.success("Emotion log saved");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save emotion log");
    }
  };

  if (loading)
    return (
      <StateCard title="Loading emotion logs" description="Sova sedang memuat catatan emosi." />
    );
  if (error) return <StateCard title="Emotion data unavailable" description={error} />;

  const emotions = [
    { l: "Cemas", v: 84, c: "var(--warning)" },
    { l: "Sedih", v: 42, c: "var(--brand)" },
    { l: "Tenang", v: 18, c: "var(--success)" },
    { l: "Marah", v: 8, c: "var(--destructive)" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Emotion Analyzer"
        description="Kenali perasaan dari tulisan dan dapatkan langkah sederhana untuk menenangkan diri."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="rounded-xl"
            placeholder="Ceritakan perasaanmu hari ini…"
          />
          <Button onClick={analyze} className="mt-4 rounded-full btn-brand border-0">
            <Sparkles className="mr-2 h-4 w-4" /> Analyze
          </Button>
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/40 py-8">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[color:var(--brand)]/25 blur-2xl animate-breath" />
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[color:var(--brand-glow)] to-[color:var(--brand)] shadow-[0_20px_60px_-15px_color-mix(in_oklab,var(--brand)_60%,transparent)] animate-breath" />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Breathe with the circle · Tarik napas pelan bersama Sova
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          {result && (
            <>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Detected</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold">{result.label}</span>
                <span className="text-sm text-muted-foreground">
                  {result.confidence}% confidence
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {emotions.map((e) => (
                  <div key={e.l}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{e.l}</span>
                      <span>{e.v}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${e.v}%`,
                          background: `color-mix(in oklab, ${e.c} 90%, transparent)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Recent Emotion Logs
                </div>
                <div className="mt-2 space-y-2">
                  {data?.logs.map((log: any) => (
                    <div
                      key={`${log.created_at}-${log.detected_emotion}`}
                      className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm"
                    >
                      <div className="flex justify-between gap-3">
                        <span>{log.detected_emotion}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatShortDate(log.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {log.input_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wind className="h-4 w-4 text-[color:var(--brand)]" /> Recommendation
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {result.rec}
                </p>
                <Button className="mt-3 rounded-full btn-brand border-0">
                  Start guided exercise
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
