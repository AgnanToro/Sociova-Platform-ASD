import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles, User, Mic, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { Sova } from "@/components/site/sova";
import { loadSimulationData, saveSimulationSession, useSociovaQuery } from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/simulation")({ component: SimulationPage });

type Msg = { from: "ai" | "me"; text: string };

function SimulationPage() {
  const { data: scenarios, loading, error } = useSociovaQuery(loadSimulationData);
  const [active, setActive] = useState("Bertemu Teman Baru");
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "ai",
      text: "Halo! 😊 Namaku Sova. Aku baru pindah ke sekolah ini. Boleh kenalan? Siapa namamu?",
    },
  ]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const activeScenario =
    scenarios?.find((scenario: any) => scenario.title === active) ?? scenarios?.[0];
  const quickReplies = activeScenario?.quick_replies ?? [
    "Namaku Bimo.",
    "Senang bertemu denganmu.",
    "Apa hobimu?",
  ];

  const send = (value?: string) => {
    const text = (value ?? input).trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { from: "me", text },
      { from: "ai", text: "Senang berkenalan denganmu! Mau duduk bersamaku saat istirahat nanti?" },
    ]);
    setInput("");
  };

  const saveSession = async () => {
    setSaving(true);
    try {
      await saveSimulationSession({
        scenario: active,
        conversation: messages,
        score: 86,
        strength: "Sapaanmu sudah jelas dan ramah.",
        suggestion:
          'Coba tambahkan pertanyaan sederhana seperti "Siapa namamu?" atau "Kamu suka bermain apa?"',
        feedback:
          "Bagus sekali! Kamu sudah memperkenalkan diri dengan sopan. Lain kali, coba tanyakan nama temanmu juga agar percakapan terasa lebih hangat.",
      });
      toast.success("Session saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save session");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <StateCard title="Loading simulation" description="Sova sedang memuat skenario latihan." />
    );
  if (error) return <StateCard title="Simulation unavailable" description={error} />;
  if (!scenarios?.length)
    return (
      <StateCard
        title="No scenarios"
        description="Demo scenarios will appear once content is available."
      />
    );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="AI Social Simulation"
        description="Berlatih situasi sosial sehari-hari dengan panduan Sova."
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-sm">
          <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
            Scenarios
          </div>
          <div className="space-y-1">
            {scenarios.map((s: any) => (
              <button
                key={s.title}
                onClick={() => {
                  setActive(s.title);
                  setMessages([{ from: "ai", text: s.opening_message }]);
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
                <div className="font-display text-lg font-bold">{active}</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand)]/10 px-3 py-1 text-xs text-[color:var(--brand)]">
                <Sparkles className="h-3 w-3" /> Adaptive Mode
              </span>
            </div>
            <div className="h-[380px] space-y-3 overflow-y-auto rounded-xl bg-background/40 p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${m.from === "me" ? "justify-end" : "justify-start"}`}
                >
                  {m.from === "ai" && <Sova size={32} float={false} glow={false} />}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "btn-brand border-0" : "bg-secondary"}`}
                  >
                    {m.text}
                  </div>
                  {m.from === "me" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickReplies.map((q: string) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-[color:var(--brand)]/40 hover:text-[color:var(--brand)]"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-11 w-11 rounded-full"
                aria-label="Voice input"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis jawabanmu di sini…"
                className="rounded-full h-11"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-11 w-11 rounded-full"
                aria-label="Read aloud"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 rounded-full btn-brand border-0"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Communication Score
              </div>
              <div className="font-display text-2xl font-bold text-[color:var(--brand)]">86%</div>
            </div>
            <Progress value={86} className="mt-2 h-2" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs font-medium text-[color:var(--success)]">Strength</div>
                <div className="mt-1 text-sm">Sapaanmu sudah jelas dan ramah.</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs font-medium text-[color:var(--brand)]">Suggestion</div>
                <div className="mt-1 text-sm">
                  Coba tambahkan pertanyaan sederhana seperti "Siapa namamu?" atau "Kamu suka
                  bermain apa?"
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-[color:var(--brand)]/5 p-3 text-sm">
              <span className="font-medium text-[color:var(--brand)]">AI Feedback: </span>
              Bagus sekali! 🌟 Kamu sudah memperkenalkan diri dengan sopan. Lain kali, coba tanyakan
              nama temanmu juga agar percakapan terasa lebih hangat.
            </div>
            <Button
              onClick={saveSession}
              disabled={saving}
              className="mt-4 rounded-full btn-brand border-0"
            >
              {saving ? "Saving..." : "Save Session"}
            </Button>
          </Card>
        </div>
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
