import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, PlayCircle, FileText, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import {
  createResource,
  loadResourcesData,
  useSociovaQuery,
} from "@/lib/sociova-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/resources")({ component: ResourcesPage });

const resourceIcons = {
  Guide: BookOpen,
  Video: PlayCircle,
  Worksheet: FileText,
  Exercise: PlayCircle,
  Checklist: FileText,
} as const;

function ResourcesPage() {
  const { role } = useAuth();
  const { data: items, loading, error, refetch } = useSociovaQuery(loadResourcesData);
  const canAdd = role === "parent" || role === "teacher" || role === "therapist";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Guide");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    try {
      await createResource({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || "Guide",
        url: url.trim() || undefined,
      });
      toast.success("Resource ditambahkan");
      setTitle("");
      setDescription("");
      setUrl("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah resource");
    } finally {
      setSaving(false);
    }
  };

  const openResource = (item: any) => {
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${item.title}</title>
      <style>body{font-family:Segoe UI,sans-serif;margin:32px;line-height:1.6;color:#123}h1{margin:0 0 8px}.muted{color:#667}</style>
      </head><body><p class="muted">${item.category || "Resource"}</p><h1>${item.title}</h1><p>${item.description || ""}</p></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const href = URL.createObjectURL(blob);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return <StateCard title="Loading resources" description="Sova sedang memuat panduan dan worksheet." />;
  }
  if (error) return <StateCard title="Resources unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Resources"
        description="Panduan, video, dan worksheet untuk orang tua, guru, dan pendamping."
      />

      {canAdd && (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Plus className="h-5 w-5 text-[color:var(--brand)]" /> Tambah resource
          </div>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul" className="rounded-xl" />
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Kategori: Guide / Video / Worksheet" className="rounded-xl" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (opsional, https://...)" className="rounded-xl md:col-span-2" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat" className="rounded-xl md:col-span-2" rows={3} />
            <div className="md:col-span-2">
              <Button disabled={saving || !title.trim() || !description.trim()} className="rounded-full btn-brand border-0">
                {saving ? "Menyimpan..." : "Simpan resource"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((r: any) => {
          const Icon = resourceIcons[r.category as keyof typeof resourceIcons] ?? BookOpen;
          return (
            <Card
              key={r.id ?? r.title}
              className="group rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand)]/40"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
                  <Icon className="h-4 w-4" />
                </span>
                {r.category} · {r.time}
              </div>
              <div className="mt-3 font-semibold">{r.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              <Button variant="outline" className="mt-4 rounded-full" onClick={() => openResource(r)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-7xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
