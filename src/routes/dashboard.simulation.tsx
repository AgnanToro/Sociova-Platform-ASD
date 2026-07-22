import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { Sova } from "@/components/site/sova";
import {
  loadSimulationData,
  saveSimulationSession,
  simulateTurn,
  useSociovaQuery,
} from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/simulation")({ component: SimulationPage });

type Msg = { from: "ai" | "me"; text: string };

function SimulationPage() {
  const { data: scenarios, loading, error } = useSociovaQuery(loadSimulationData);
  const [active, setActive] = useState("Bertemu Teman Baru");
  const [messages, setMessages] = useState<Msg[]>([
    { from: "ai", text: "Halo! Namaku Sova. Aku baru pindah ke sekolah ini. Boleh kenalan? Siapa namamu?" },
  ]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeScenario =
    scenarios?.find((scenario: any) => scenario.title === active) ?? scenarios?.[0];
  const quickReplies = activeScenario?.quick_replies ?? [
    "Namaku Bimo.",
    "Senang bertemu denganmu.",
    "Apa hobimu?",
  ];

  const progressValue = useMemo(() => {
    const turns = messages.filter((item) => item.from === "me").length;
    return Math.min(100, turns * 20);
  }, [messages]);

  const send = async (value?: string) => {
    const text = (value ?? input).trim();
    if (!text) return;
    const nextMessages: Msg[] = [...messages, { from: "me", text }];
    setMessages(nextMessages);
    setInput("");
    try {
      const result = await simulateTurn({
        scenario: activeScenario?.title ?? active,
        conversation: nextMessages,
      });
      setMessages((current) => [...current, { from: "ai", text: result.aiReply }]);
      setScore(result.score);
      setFeedback(result.feedback);
    } catch {
      setMessages((current) => [
        ...current,
        { from: "ai", text: "Terima kasih sudah menjawab. Apa yang ingin kamu sampaikan selanjutnya?" },
      ]);
    }
  };

  const saveSession = async () => {
    setSaving(true);
    try {
      const result = await saveSimulationSession({
        scenario: activeScenario?.title ?? active,
        conversation: messages,
      });
      setScore(result.score ?? score);
      setFeedback(result.feedback ?? feedback);
      toast.success(`Sesi disimpan · skor ${result.score ?? score ?? "-"}%`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save session");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StateCard title="Loading simulation" description="Memuat skenario latihan." />;
  if (error) return <StateCard title="Simulation unavailable" description={error} />;
  if (!scenarios?.length) return <StateCard title="No scenarios" description="Belum ada skenario simulasi." />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="AI Social Simulation" description="Berlatih situasi sosial sehari-hari dengan panduan Sova." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-sm">
          <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Scenarios</div>
          <div className="space-y-1">
            {scenarios.map((s: any) => (
              <button
                key={s.title}
                onClick={() => {
                  setActive(s.title);
                  setMessages([{ from: "ai", text: s.opening_message }]);
                  setScore(null);
                  setFeedback(null);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active === s.title
                    ? "bg-[color:var(--brand)]/10 text-[color:var(--brand)]"
                    : "hover:bg-accent"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Now practicing</div>
                <div className="font-display text-lg font-bold">{activeScenario?.title ?? active}</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand)]/10 px-3 py-1 text-xs text-[color:var(--brand)]">
                <Sparkles className="h-3 w-3" /> Adaptive Mode
              </span>
            </div>
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Conversation progress</span>
                <span>{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
            <div className="h-[380px] space-y-3 overflow-y-auto rounded-xl bg-background/40 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  {m.from === "ai" && <Sova size={32} float={false} glow={false} />}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === "me"
                        ? "bg-[color:var(--brand)] text-white"
                        : "bg-card border border-border/60"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickReplies.map((reply: string) => (
                <Button key={reply} variant="outline" className="rounded-full" onClick={() => send(reply)}>
                  {reply}
                </Button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis jawabanmu di sini..."
                className="rounded-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <Button className="rounded-full btn-brand border-0" onClick={() => send()}>
                Send
              </Button>
              <Button variant="outline" className="rounded-full" disabled={saving} onClick={saveSession}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            {(score != null || feedback) && (
              <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
                {score != null && <div className="font-semibold">Skor latihan: {score}%</div>}
                {feedback && <p className="mt-1 text-muted-foreground">{feedback}</p>}
              </div>
            )}
          </Card>
        </div>
      </div>
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
