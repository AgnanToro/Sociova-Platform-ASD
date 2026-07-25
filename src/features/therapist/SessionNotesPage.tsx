import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createRecommendation,
  createSessionNote,
  formatShortDate,
  loadRoleDashboardData,
  loadRoleDetailData,
  useSociovaQuery,
} from "@/lib/sociova-data";

export function SessionNotesPage() {
  const clients = useSociovaQuery(() => loadRoleDashboardData("therapist"));
  const [childId, setChildId] = useState<string | undefined>();
  const detail = useSociovaQuery(() => loadRoleDetailData(childId), [childId]);

  const [title, setTitle] = useState("Catatan sesi");
  const [note, setNote] = useState("");
  const [nextFocus, setNextFocus] = useState("");
  const [recTitle, setRecTitle] = useState("Rekomendasi terapi");
  const [recDesc, setRecDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const children = clients.data?.children ?? detail.data?.children ?? [];

  useEffect(() => {
    if (!childId && children.length === 1) setChildId(children[0].id);
  }, [children, childId]);

  const activeChild =
    children.find((c: any) => c.id === childId) ?? detail.data?.child ?? children[0];

  const submitNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    if (!childId && children.length > 1) {
      toast.error("Pilih klien terlebih dahulu");
      return;
    }
    setSaving(true);
    try {
      await createSessionNote({
        title: title.trim() || "Catatan sesi",
        note: note.trim(),
        next_focus: nextFocus.trim() || undefined,
        child_id: childId ?? activeChild?.id,
      });
      toast.success("Catatan sesi disimpan");
      setNote("");
      setNextFocus("");
      detail.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan catatan");
    } finally {
      setSaving(false);
    }
  };

  const submitRecommendation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recDesc.trim()) return;
    if (!childId && children.length > 1) {
      toast.error("Pilih klien terlebih dahulu");
      return;
    }
    setSaving(true);
    try {
      await createRecommendation({
        title: recTitle.trim() || "Rekomendasi terapi",
        description: recDesc.trim(),
        audience: "parent",
        category: "Therapy",
        child_id: childId ?? activeChild?.id,
      });
      toast.success("Rekomendasi dikirim ke orang tua");
      setRecDesc("");
      detail.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan rekomendasi");
    } finally {
      setSaving(false);
    }
  };

  if (clients.loading || detail.loading) {
    return <State title="Memuat catatan" description="Menyiapkan data klien." />;
  }
  if (clients.error || detail.error) {
    return (
      <State
        title="Catatan belum tersedia"
        description={clients.error ?? detail.error ?? "Coba lagi nanti."}
      />
    );
  }

  if (!children.length) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Catatan sesi" description="Belum ada klien terhubung." />
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Hubungkan klien lewat care team agar catatan bisa disimpan per anak.
        </Card>
      </div>
    );
  }

  const notes = detail.data?.notes ?? [];
  const recommendations = detail.data?.recommendations ?? [];
  const childName = activeChild?.name ?? "klien";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Catatan sesi"
        description={`Catatan terapi dan rekomendasi untuk ${childName}.`}
      />

      {children.length > 1 && (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-5">
          <Label htmlFor="client-select">Pilih klien</Label>
          <Select value={childId ?? activeChild?.id} onValueChange={setChildId}>
            <SelectTrigger id="client-select" className="mt-2 max-w-sm rounded-xl">
              <SelectValue placeholder="Pilih klien" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.age != null ? ` · ${c.age} th` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <h2 className="font-display text-lg font-bold">Tambah catatan sesi</h2>
          <form onSubmit={submitNote} className="mt-4 space-y-3">
            {children.length > 1 && (
              <p className="text-xs text-muted-foreground">Untuk: {childName}</p>
            )}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul sesi"
              className="rounded-xl"
            />
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="rounded-xl"
              placeholder="Ringkasan sesi"
            />
            <Textarea
              value={nextFocus}
              onChange={(e) => setNextFocus(e.target.value)}
              rows={3}
              className="rounded-xl"
              placeholder="Fokus berikutnya (opsional)"
            />
            <Button disabled={saving || !note.trim()} className="rounded-full btn-brand border-0">
              {saving ? "Menyimpan…" : "Simpan catatan"}
            </Button>
          </form>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <h2 className="font-display text-lg font-bold">Rekomendasi untuk orang tua</h2>
          <form onSubmit={submitRecommendation} className="mt-4 space-y-3">
            {children.length > 1 && (
              <p className="text-xs text-muted-foreground">Untuk: {childName}</p>
            )}
            <Input
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              placeholder="Judul rekomendasi"
              className="rounded-xl"
            />
            <Textarea
              value={recDesc}
              onChange={(e) => setRecDesc(e.target.value)}
              rows={5}
              className="rounded-xl"
              placeholder="Saran praktis di rumah"
            />
            <Button disabled={saving || !recDesc.trim()} className="rounded-full btn-brand border-0">
              {saving ? "Menyimpan…" : "Kirim rekomendasi"}
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <h2 className="font-display text-lg font-bold">Catatan tersimpan</h2>
          <div className="mt-4 space-y-3">
            {notes.length ? (
              notes.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[color:var(--brand)]" />
                    <div className="font-medium">{item.title}</div>
                  </div>
                  {item.session_at && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatShortDate(item.session_at)}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada catatan untuk {childName}.</p>
            )}
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <h2 className="font-display text-lg font-bold">Rekomendasi</h2>
          <div className="mt-4 space-y-3">
            {recommendations.length ? (
              recommendations.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-border/60 p-3">
                  <div className="font-medium">{item.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada rekomendasi untuk {childName}.
              </p>
            )}
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
