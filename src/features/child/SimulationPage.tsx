import { useEffect, useMemo, useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { Check, Heart, Lock, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { Sova } from "@/components/site/sova";
import { ScenarioScene } from "@/components/site/scenario-scene";
import {
  loadSimulationData,
  saveSimulationSession,
  useSociovaQuery,
} from "@/lib/sociova-data";
import { getScenarioGame, type GameChoice } from "@/lib/simulation-scenes";
import { shuffleChoices } from "@/lib/journey-map";
import { cn } from "@/lib/utils";

type Flash = { type: "ok" | "bad"; text: string } | null;

const simRoute = getRouteApi("/dashboard/child/simulation");

export function SimulationPage() {
  const search = simRoute.useSearch();
  const { data: scenarios, loading, error, refetch } = useSociovaQuery(loadSimulationData);
  const [active, setActive] = useState("");
  const [journeyLevelId, setJourneyLevelId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [phase, setPhase] = useState<"play" | "win" | "lose">("play");
  const [saving, setSaving] = useState(false);
  const [lastReward, setLastReward] = useState<{
    xp?: number;
    coins?: number;
    journeyTitle?: string;
  } | null>(null);
  const [log, setLog] = useState<Array<{ from: "ai" | "me"; text: string }>>([]);
  const [shuffledChoices, setShuffledChoices] = useState<GameChoice[]>([]);
  const [ready, setReady] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  const list = scenarios ?? [];
  const unlockedList = list.filter((s: any) => s.unlocked !== false);
  const activeTitle = active || unlockedList[0]?.title || list[0]?.title || "Bertemu Teman Baru";
  const game = getScenarioGame(activeTitle);
  const step = game.steps[stepIndex];
  const totalSteps = game.steps.length;
  const progressValue = useMemo(() => {
    if (phase === "win") return 100;
    return Math.round((stepIndex / Math.max(totalSteps, 1)) * 100);
  }, [phase, stepIndex, totalSteps]);

  const applyStepChoices = (gTitle: string, index: number) => {
    const g = getScenarioGame(gTitle);
    const current = g.steps[index];
    setShuffledChoices(current ? shuffleChoices(current.choices) : []);
  };

  const resetGame = (title: string, journeyId?: string | null) => {
    const g = getScenarioGame(title);
    setActive(title);
    setJourneyLevelId(journeyId ?? null);
    setStepIndex(0);
    setHearts(3);
    setCorrectCount(0);
    setWrongCount(0);
    setPickedId(null);
    setFlash(null);
    setPhase("play");
    setLastReward(null);
    setAutoSaved(false);
    setSaving(false);
    setLog([{ from: "ai", text: g.intro }]);
    applyStepChoices(title, 0);
  };

  useEffect(() => {
    if (!list.length || ready) return;
    const fromSearch = search.scenario
      ? list.find((s: any) => s.title === search.scenario)
      : null;
    if (fromSearch) {
      if (fromSearch.unlocked === false) {
        const firstOpen = list.find((s: any) => s.unlocked !== false) ?? list[0];
        resetGame(firstOpen.title, firstOpen.journey_level_id);
        toast.message("Level itu masih terkunci. Main level yang sudah terbuka dulu.");
      } else {
        resetGame(
          fromSearch.title,
          search.journey || fromSearch.journey_level_id || null,
        );
      }
    } else {
      const firstOpen = list.find((s: any) => s.unlocked !== false) ?? list[0];
      resetGame(firstOpen.title, firstOpen.journey_level_id);
    }
    setReady(true);
  }, [list, ready, search.scenario, search.journey]);

  // Re-apply when search changes after ready
  useEffect(() => {
    if (!ready || !list.length || !search.scenario) return;
    const target = list.find((s: any) => s.title === search.scenario);
    if (!target || target.unlocked === false) return;
    if (target.title !== active) {
      resetGame(target.title, search.journey || target.journey_level_id || null);
    } else if (search.journey && search.journey !== journeyLevelId) {
      setJourneyLevelId(search.journey);
    }
  }, [search.scenario, search.journey]);

  const pick = (choice: GameChoice) => {
    if (phase !== "play" || pickedId || !step) return;
    setPickedId(choice.id);
    setLog((prev) => [
      ...prev,
      { from: "ai", text: step.prompt },
      { from: "me", text: choice.text },
    ]);

    if (choice.correct) {
      setFlash({ type: "ok", text: choice.feedback });
      setCorrectCount((n) => n + 1);
      window.setTimeout(() => {
        const next = stepIndex + 1;
        if (next >= totalSteps) {
          setPhase("win");
          setFlash({ type: "ok", text: game.winMessage });
        } else {
          setStepIndex(next);
          setPickedId(null);
          setFlash(null);
          applyStepChoices(activeTitle, next);
        }
      }, 900);
    } else {
      setFlash({ type: "bad", text: choice.feedback });
      setWrongCount((n) => n + 1);
      const nextHearts = hearts - 1;
      setHearts(nextHearts);
      window.setTimeout(() => {
        if (nextHearts <= 0) {
          setPhase("lose");
        } else {
          // reshuffle wrong attempt so correct isn't always same spot
          setShuffledChoices(shuffleChoices(step.choices));
          setPickedId(null);
          setFlash(null);
        }
      }, 1100);
    }
  };

  const scorePercent = useMemo(() => {
    const attempts = correctCount + wrongCount;
    if (!attempts) return 0;
    return Math.max(
      40,
      Math.min(
        100,
        Math.round((correctCount / Math.max(totalSteps, 1)) * 100 - wrongCount * 5 + 20),
      ),
    );
  }, [correctCount, wrongCount, totalSteps]);

  // Auto-save when player wins — no manual "Ambil XP" required
  useEffect(() => {
    if (phase !== "win" || autoSaved || saving) return;
    let cancelled = false;
    const run = async () => {
      setSaving(true);
      setAutoSaved(true);
      try {
        const attempts = correctCount + wrongCount;
        const score = attempts
          ? Math.max(
              40,
              Math.min(
                100,
                Math.round((correctCount / Math.max(totalSteps, 1)) * 100 - wrongCount * 5 + 20),
              ),
            )
          : 80;
        const conversation = [...log, { from: "ai" as const, text: game.winMessage }];
        const result = await saveSimulationSession({
          scenario: activeTitle,
          conversation,
          score,
          difficulty: game.difficulty,
          feedback: `Game selesai. Benar ${correctCount}/${totalSteps}. Salah ${wrongCount}.`,
          journey_level_id: journeyLevelId,
        });
        if (cancelled) return;
        setLastReward({
          xp: result.xpGained,
          coins: result.coins,
          journeyTitle: result.journeyCompleted?.title,
        });
        if (result.journeyCompleted && !result.journeyCompleted.already) {
          toast.success(
            `Level ${result.journeyCompleted.title} selesai · +${result.xpGained ?? 0} XP`,
          );
        } else if (result.journeyCompleted?.already) {
          toast.success(`Hebat! +${result.xpGained ?? 0} XP`);
        } else {
          toast.success(`Menang! +${result.xpGained ?? 0} XP`);
        }
        if (result.newBadges?.length) {
          toast.success(`Badge: ${result.newBadges.map((b: any) => b.name).join(", ")}`);
        }
        refetch();
      } catch (err) {
        if (!cancelled) {
          setAutoSaved(false);
          toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
        }
      } finally {
        if (!cancelled) setSaving(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (loading) return <StateCard title="Sedang memuat" description="Sova menyiapkan game untukmu." />;
  if (error) return <StateCard title="Belum bisa dibuka" description={error} />;
  if (!list.length) return <StateCard title="Belum ada level" description="Level akan muncul segera." />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Simulasi Sosial"
        description="Pilih level, jawab pertanyaan, dan kumpulkan XP bersama Sova."
      />

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-sm">
          <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
            Pilih level
          </div>
          <div className="space-y-1">
            {list.map((s: any) => {
              const locked = s.unlocked === false;
              return (
                <button
                  key={s.title}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    resetGame(s.title, s.journey_level_id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    activeTitle === s.title && !locked
                      ? "bg-[color:var(--brand)]/10 text-[color:var(--brand)]"
                      : locked
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-accent",
                  )}
                >
                  {locked && <Lock className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Level terbuka seiring perjalananmu. Menang game = level selesai.
          </p>
        </Card>

        <div className="space-y-4">
          <ScenarioScene title={activeTitle} />

          <Card className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Bermain dengan {game.role}</div>
                <div className="font-display text-lg font-bold">{activeTitle}</div>
                <div className="text-xs text-muted-foreground">
                  Pertanyaan {Math.min(stepIndex + 1, totalSteps)} dari {totalSteps}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={cn(
                      "h-6 w-6",
                      i < hearts ? "fill-red-500 text-red-500" : "text-muted-foreground/40",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            {phase === "play" && step && (
              <div className="mt-5 space-y-4">
                <div className="flex gap-3 rounded-2xl border border-border/60 bg-background/50 p-4">
                  <Sova size={48} float={false} glow={false} />
                  <div>
                    <div className="text-sm font-medium leading-relaxed">{step.prompt}</div>
                    {step.hint && (
                      <div className="mt-1 text-xs text-muted-foreground">Petunjuk: {step.hint}</div>
                    )}
                  </div>
                </div>

                {flash && (
                  <div
                    className={cn(
                      "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                      flash.type === "ok"
                        ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/10 text-[color:var(--success)]"
                        : "border-destructive/40 bg-destructive/10 text-destructive",
                    )}
                  >
                    {flash.type === "ok" ? (
                      <Check className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                      <X className="mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <span>{flash.text}</span>
                  </div>
                )}

                <div className="grid gap-2">
                  {(shuffledChoices.length ? shuffledChoices : step.choices).map((choice) => {
                    const show = pickedId === choice.id;
                    const isOk = show && choice.correct;
                    const isBad = show && !choice.correct;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={Boolean(pickedId)}
                        onClick={() => pick(choice)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.99]",
                          isOk && "border-[color:var(--success)] bg-[color:var(--success)]/10",
                          isBad && "border-destructive bg-destructive/10",
                          !show &&
                            "border-border/60 bg-background/40 hover:border-[color:var(--brand)]/50 hover:bg-[color:var(--brand)]/5",
                          pickedId && !show && "opacity-50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                            isOk &&
                              "border-[color:var(--success)] bg-[color:var(--success)] text-white",
                            isBad && "border-destructive bg-destructive text-white",
                            !show && "border-border bg-card",
                          )}
                        >
                          {isOk ? (
                            <Check className="h-4 w-4" />
                          ) : isBad ? (
                            <X className="h-4 w-4" />
                          ) : null}
                        </span>
                        <span>{choice.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {phase === "win" && (
              <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
                  <Check className="h-8 w-8" />
                </div>
                <Sova size={72} />
                <div className="font-display text-xl font-bold">{game.winMessage}</div>
                <p className="text-sm text-muted-foreground">
                  Benar {correctCount}/{totalSteps} · Nyawa sisa {hearts}
                </p>
                {lastReward?.journeyTitle && (
                  <p className="text-sm font-medium text-[color:var(--brand)]">
                    Level {lastReward.journeyTitle} selesai!
                  </p>
                )}
                {lastReward?.xp != null && (
                  <div className="rounded-full bg-[color:var(--brand)]/10 px-4 py-1 text-sm text-[color:var(--brand)]">
                    +{lastReward.xp} XP
                    {lastReward.coins != null ? ` · ${lastReward.coins} koin` : ""}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {saving && !lastReward && (
                    <div className="inline-flex items-center rounded-full bg-[color:var(--brand)]/10 px-4 py-2 text-sm text-[color:var(--brand)]">
                      <Sparkles className="mr-1 h-4 w-4 animate-pulse" /> Menyimpan hadiah...
                    </div>
                  )}
                  {lastReward && (
                    <Button asChild className="rounded-full btn-brand border-0">
                      <Link to="/dashboard/child/journey" search={{}}>
                        Lihat Perjalanan
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => resetGame(activeTitle, journeyLevelId)}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" /> Main lagi
                  </Button>
                </div>
              </div>
            )}

            {phase === "lose" && (
              <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <X className="h-8 w-8" />
                </div>
                <Sova size={64} float={false} />
                <div className="font-display text-xl font-bold">Nyawa habis</div>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Tidak apa-apa. Yuk coba lagi!
                </p>
                <Button
                  className="rounded-full btn-brand border-0"
                  onClick={() => resetGame(activeTitle, journeyLevelId)}
                >
                  <RotateCcw className="mr-1 h-4 w-4" /> Coba lagi
                </Button>
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
