import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Save, Sparkles, Image as ImageIcon, History } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/site/page-header";
import {
  loadStoryData,
  saveSocialStory,
  useSociovaQuery,
  formatShortDate,
} from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/story")({ component: StoryPage });

function StoryPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadStoryData);
  const [prompt, setPrompt] = useState("Bimo merasa gugup di hari pertamanya masuk sekolah baru.");
  const [story, setStory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    const generated =
      `Hari ini Bimo akan masuk ke sekolah baru.\n\n` +
      `Bimo mungkin merasa gugup. Itu tidak apa-apa.\n\n` +
      `Di sekolah, Bimo akan bertemu guru dan teman baru. Bimo bisa menyapa dengan berkata: "Halo, namaku Bimo."\n\n` +
      `Jika merasa bingung, Bimo boleh bertanya kepada guru.\n\n` +
      `Bimo aman. Bimo bisa mencoba pelan-pelan.`;
    setStory(generated);
    setSaving(true);
    try {
      await saveSocialStory(prompt, generated);
      toast.success("Story saved");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save story");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <StateCard title="Loading stories" description="Sova sedang memuat cerita sosial terbaru." />
    );
  if (error) return <StateCard title="Stories unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="AI Social Story Generator"
        description="Ubah situasi baru menjadi cerita sederhana yang menenangkan."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="space-y-3">
            <Label htmlFor="prompt">Describe the situation</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="rounded-xl"
              placeholder="Contoh: Bimo merasa gugup di hari pertamanya masuk sekolah baru."
            />
            <Button
              onClick={generate}
              disabled={saving}
              className="rounded-full btn-brand border-0"
            >
              <Sparkles className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Generate Story"}
            </Button>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <History className="h-3 w-3" /> Recent
            </div>
            <ul className="space-y-2 text-sm">
              {data?.stories.map((item: any) => (
                <li
                  key={`${item.title}-${item.created_at}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                >
                  <span>{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatShortDate(item.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--brand)]/10 to-[color:var(--brand-glow)]/10 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs">Illustration placeholder</span>
            </div>
          </div>
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-background/40 p-4 text-sm leading-relaxed">
            {story ??
              "Cerita hasil AI akan muncul di sini.\n\nTuliskan situasi yang ingin kamu latih, misalnya pergi ke dokter, hari pertama sekolah, atau bertemu teman baru."}
          </div>
          {story && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="rounded-full">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" className="rounded-full">
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
            </div>
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
