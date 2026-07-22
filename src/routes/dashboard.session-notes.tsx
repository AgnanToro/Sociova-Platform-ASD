import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import {
  createRecommendation,
  createSessionNote,
  formatShortDate,
  loadRoleDetailData,
  useSociovaQuery,
} from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/session-notes")({
  head: () => ({ meta: [{ title: "Session Notes · Sociova" }] }),
  component: SessionNotesPage,
});

function SessionNotesPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadRoleDetailData);
  const [title, setTitle] = useState("Catatan sesi");
  const [note, setNote] = useState("");
  const [nextFocus, setNextFocus] = useState("");
  const [recTitle, setRecTitle] = useState("Rekomendasi terapi");
  const [recDesc, setRecDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const submitNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await createSessionNote({
        title: title.trim() || "Catatan sesi",
        note: note.trim(),
        next_focus: nextFocus.trim() || undefined,
      });
      toast.success("Catatan sesi disimpan");
      setNote("");
      setNextFocus("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan catatan");
    } finally {
      setSaving(false);
    }
  };

  const submitRecommendation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recDesc.trim()) return;
    setSaving(true);
    try {
      await createRecommendation({
        title: recTitle.trim() || "Rekomendasi terapi",
        description: recDesc.trim(),
        audience: "parent",
        category: "Therapy",
      });
      toast.success("Rekomendasi dikirim ke orang tua");
      setRecDesc("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan rekomendasi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <State title="Loading session notes" description="Memuat catatan sesi terapi." />;
  if (error) return <State title="Session notes unavailable" description={error} />;

  const notes = data?.notes ?? [];
  const recommendations = data?.recommendations ?? [];
  const child = data?.child;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Session Notes"
        description={child ? `Catatan sesi terapi untuk ${child.name}.` : "Catatan sesi terapi klien Anda."}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <h2 className="font-display text-lg font-bold">Tambah catatan sesi</h2>
          <form onSubmit={submitNote} className="mt-4 space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="rounded-xl" placeholder="Ringkasan sesi..." />
            <Textarea value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} rows={3} className="rounded-xl" placeholder="Fokus berikutnya (opsional)" />
            <Button disabled={saving || !note.trim()} className="rounded-full btn-brand border-0">
              {saving ? "Menyimpan..." : "Simpan catatan"}
            </Button>
          </form>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <h2 className="font-display text-lg font-bold">Rekomendasi untuk orang tua</h2>
          <form onSubmit={submitRecommendation} className="mt-4 space-y-3">
            <Input value={recTitle} onChange={(e) => setRecTitle(e.target.value)} className="rounded-xl" />
            <Textarea value={recDesc} onChange={(e) => setRecDesc(e.target.value)} rows={5} className="rounded-xl" placeholder="Tuliskan rekomendasi praktis di rumah..." />
            <Button disabled={saving || !recDesc.trim()} className="rounded-full btn-brand border-0">
              {saving ? "Menyimpan..." : "Kirim rekomendasi"}
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <h2 className="font-display text-lg font-bold">Catatan tersimpan</h2>
          <div className="mt-4 space-y-3">
            {notes.length ? notes.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[color:var(--brand)]" />
                  <div className="font-medium">{item.title}</div>
                </div>
                {item.session_at && <div className="mt-1 text-xs text-muted-foreground">{formatShortDate(item.session_at)}</div>}
                <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Belum ada catatan sesi.</p>}
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <h2 className="font-display text-lg font-bold">Rekomendasi</h2>
          <div className="mt-4 space-y-3">
            {recommendations.length ? recommendations.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-border/60 p-3">
                <div className="font-medium">{item.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Belum ada rekomendasi.</p>}
          </div>
        </Card>
      </div>
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
