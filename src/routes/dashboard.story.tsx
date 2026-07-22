import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookHeart, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import {
  formatShortDate,
  generateStory,
  loadStoryData,
  saveSocialStory,
  useSociovaQuery,
} from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/story")({ component: StoryPage });

function StoryPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadStoryData);
  const [prompt, setPrompt] = useState(
    "Bimo merasa gugup di hari pertamanya masuk sekolah baru.",
  );
  const [story, setStory] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setSaving(true);
    try {
      const generated = await generateStory(prompt);
      setStory(generated.generatedStory);
      setTitle(generated.title);
      toast.success("Cerita sosial dibuat");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat cerita");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!story.trim()) return;
    setSaving(true);
    try {
      await saveSocialStory(prompt, story);
      toast.success("Cerita disimpan ke MySQL");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan cerita");
    } finally {
      setSaving(false);
    }
  };

  const speak = () => {
    if (!story || typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech tidak tersedia di browser ini");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(story);
    utterance.lang = "id-ID";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  if (loading) return <State title="Loading stories" description="Memuat social story." />;
  if (error) return <State title="Stories unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Social Story"
        description="Buat cerita sosial singkat yang membantu anak memahami situasi baru."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <label className="text-sm font-medium">Situasi</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="mt-2 rounded-xl"
            placeholder="Contoh: Bimo merasa gugup di hari pertamanya masuk sekolah baru."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={generate} disabled={saving || !prompt.trim()} className="rounded-full btn-brand border-0">
              <Sparkles className="mr-2 h-4 w-4" /> Generate
            </Button>
            <Button onClick={save} disabled={saving || !story.trim()} variant="outline" className="rounded-full">
              Simpan
            </Button>
            <Button onClick={speak} disabled={!story.trim()} variant="outline" className="rounded-full">
              <Volume2 className="mr-2 h-4 w-4" /> Baca
            </Button>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookHeart className="h-4 w-4 text-[color:var(--brand)]" />
            {title || "Hasil cerita"}
          </div>
          <div className="mt-4 min-h-56 whitespace-pre-wrap rounded-xl border border-border/60 bg-background/40 p-4 text-sm leading-relaxed">
            {story || "Cerita sosial yang digenerate akan muncul di sini."}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-[color:var(--brand)]/15 to-transparent p-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Visual scene</div>
            <p className="mt-2 text-sm">
              {prompt
                ? `Ilustrasi situasi: ${prompt}`
                : "Panel visual untuk membantu anak memahami alur cerita."}
            </p>
          </div>
        </Card>
      </div>
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Cerita tersimpan</h2>
        <div className="mt-4 space-y-3">
          {(data?.stories ?? []).map((item: any, index: number) => (
            <div key={`${item.title}-${index}`} className="rounded-xl border border-border/60 p-3">
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
