import { useEffect, useMemo, useState } from "react";
import {
  BookHeart,
  Bus,
  Check,
  ChevronLeft,
  ChevronRight,
  Hand,
  PartyPopper,
  School,
  Users,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { Sova, SovaBubble } from "@/components/site/sova";
import {
  formatShortDate,
  loadStoryData,
  saveSocialStory,
  useSociovaQuery,
} from "@/lib/sociova-data";
import { STORY_PRESETS, type StoryPreset } from "@/lib/social-stories";
import { cn } from "@/lib/utils";

const ICONS: Record<StoryPreset["icon"], LucideIcon> = {
  school: School,
  swing: Users,
  bus: Bus,
  hello: Hand,
  queue: Users,
  party: PartyPopper,
};

type Phase = "pick" | "read" | "done";

export function ChildStoryPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadStoryData);
  const [phase, setPhase] = useState<Phase>("pick");
  const [active, setActive] = useState<StoryPreset | null>(null);
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<{ xp?: number; coins?: number } | null>(null);

  const totalPages = active?.pages.length ?? 0;
  const progress = useMemo(() => {
    if (!totalPages) return 0;
    if (phase === "done") return 100;
    return Math.round(((page + 1) / totalPages) * 100);
  }, [page, totalPages, phase]);

  const openStory = (preset: StoryPreset) => {
    setActive(preset);
    setPage(0);
    setPhase("read");
    setReward(null);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech tidak tersedia di browser ini");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const speakPage = () => {
    if (!active) return;
    speak(active.pages[page] ?? "");
  };

  const next = () => {
    if (!active) return;
    if (page < active.pages.length - 1) {
      setPage((p) => p + 1);
      return;
    }
    setPhase("done");
  };

  const prev = () => {
    if (page > 0) setPage((p) => p - 1);
  };

  // Auto-save XP once when finished reading (no farm on re-read of same story)
  useEffect(() => {
    if (phase !== "done" || !active || reward != null || saving) return;
    let cancelled = false;
    const run = async () => {
      setSaving(true);
      try {
        const storyText = active.pages.join("\n");
        const result = await saveSocialStory(active.situation, storyText, active.title);
        if (cancelled) return;
        if (result.already) {
          setReward({ xp: 0, coins: result.coins });
          toast.message(result.message ?? "Cerita ini sudah pernah dibaca. Coba yang lain.");
        } else {
          setReward({ xp: result.xpGained ?? 40, coins: result.coins });
          toast.success(`Cerita selesai · +${result.xpGained ?? 40} XP`);
        }
        refetch();
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
      } finally {
        if (!cancelled) setSaving(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, active?.id]);

  const backToList = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPhase("pick");
    setActive(null);
    setPage(0);
    setReward(null);
  };

  if (loading) return <State title="Loading stories" description="Sova menyiapkan cerita." />;
  if (error) return <State title="Stories unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Social Story"
        description="Pilih cerita, baca pelan-pelan, atau dengar Sova membacakannya."
      />

      {phase === "pick" && (
        <>
          <SovaBubble message="Pilih satu cerita. Tidak perlu mengetik — tinggal ketuk kartunya!" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STORY_PRESETS.map((preset) => {
              const Icon = ICONS[preset.icon];
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => openStory(preset)}
                  className="group rounded-2xl border-2 border-border/60 bg-card/60 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand)]/40"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: `color-mix(in oklab, ${preset.color} 18%, transparent)`,
                      color: preset.color,
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-3 font-semibold group-hover:text-[color:var(--brand)]">
                    {preset.title}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {preset.situation}
                  </p>
                  <div className="mt-3 text-xs font-medium text-[color:var(--brand)]">
                    Baca cerita →
                  </div>
                </button>
              );
            })}
          </div>

          {(data?.stories?.length ?? 0) > 0 && (
            <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
              <h2 className="font-display text-lg font-bold">Sudah dibaca</h2>
              <div className="mt-4 space-y-3">
                {(data?.stories ?? []).slice(0, 6).map((item: any, index: number) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-xl border border-border/60 bg-background/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.created_at ? formatShortDate(item.created_at) : "-"}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.situation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {phase === "read" && active && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={backToList}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Semua cerita
            </Button>
            <div className="text-xs text-muted-foreground">
              Halaman {page + 1} / {totalPages}
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          <Card className="overflow-hidden rounded-2xl border-border/60 bg-card/60">
            <div
              className="flex items-center gap-3 border-b border-border/50 px-5 py-4"
              style={{
                background: `color-mix(in oklab, ${active.color} 12%, transparent)`,
              }}
            >
              <Sova size={48} float={false} glow={false} />
              <div>
                <div className="font-display text-lg font-bold">{active.title}</div>
                <div className="text-xs text-muted-foreground">{active.situation}</div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-border/60 bg-background/40 p-6 text-center">
                <p className="max-w-lg text-lg font-medium leading-relaxed">
                  {active.pages[page]}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  disabled={page === 0}
                  onClick={prev}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
                </Button>
                <Button variant="outline" className="rounded-full" onClick={speakPage}>
                  <Volume2 className="mr-1 h-4 w-4" /> Dengar
                </Button>
                <Button className="rounded-full btn-brand border-0" onClick={next}>
                  {page >= totalPages - 1 ? (
                    <>
                      Selesai baca <Check className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Lanjut <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {phase === "done" && active && (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
            <Check className="h-8 w-8" />
          </div>
          <div className="mt-4 flex justify-center">
            <Sova size={72} />
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold">Cerita selesai!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Kamu sudah membaca &ldquo;{active.title}&rdquo;. Ambil XP, atau baca lagi.
          </p>
          {reward?.xp != null && (
            <div className="mt-3 inline-flex rounded-full bg-[color:var(--brand)]/10 px-4 py-1 text-sm text-[color:var(--brand)]">
              +{reward.xp} XP
              {reward.coins != null ? ` · ${reward.coins} coins` : ""}
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {saving && !reward && (
              <div className="inline-flex items-center rounded-full bg-[color:var(--brand)]/10 px-4 py-2 text-sm text-[color:var(--brand)]">
                <BookHeart className="mr-1 h-4 w-4" /> Menyimpan XP...
              </div>
            )}
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setPhase("read");
                setPage(0);
              }}
            >
              Baca lagi
            </Button>
            <Button className="rounded-full btn-brand border-0" onClick={backToList}>
              Cerita lain
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function State({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
