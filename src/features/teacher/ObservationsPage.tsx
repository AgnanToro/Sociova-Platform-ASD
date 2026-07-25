import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
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
  createObservation,
  formatShortDate,
  loadRoleDashboardData,
  loadRoleDetailData,
  useSociovaQuery,
} from "@/lib/sociova-data";

export function ObservationsPage() {
  const students = useSociovaQuery(() => loadRoleDashboardData("teacher"));
  const [childId, setChildId] = useState<string | undefined>();
  const detail = useSociovaQuery(() => loadRoleDetailData(childId), [childId]);

  const [title, setTitle] = useState("Observasi kelas");
  const [observation, setObservation] = useState("");
  const [supportPlan, setSupportPlan] = useState("");
  const [saving, setSaving] = useState(false);

  const children = students.data?.children ?? detail.data?.children ?? [];

  useEffect(() => {
    if (!childId && children.length === 1) setChildId(children[0].id);
  }, [children, childId]);

  const activeChild =
    children.find((c: any) => c.id === childId) ?? detail.data?.child ?? children[0];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!observation.trim()) return;
    if (!childId && children.length > 1) {
      toast.error("Pilih siswa terlebih dahulu");
      return;
    }
    setSaving(true);
    try {
      await createObservation({
        title: title.trim() || "Observasi kelas",
        observation: observation.trim(),
        support_plan: supportPlan.trim() || undefined,
        child_id: childId ?? activeChild?.id,
      });
      toast.success("Observasi disimpan");
      setObservation("");
      setSupportPlan("");
      detail.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan observasi");
    } finally {
      setSaving(false);
    }
  };

  if (students.loading || detail.loading) {
    return <State title="Memuat observasi" description="Menyiapkan data siswa." />;
  }
  if (students.error || detail.error) {
    return (
      <State
        title="Observasi belum tersedia"
        description={students.error ?? detail.error ?? "Coba lagi nanti."}
      />
    );
  }

  if (!children.length) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Observasi" description="Belum ada siswa terhubung." />
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Hubungkan siswa lewat care team agar observasi tersimpan per anak.
        </Card>
      </div>
    );
  }

  const observations = detail.data?.observations ?? [];
  const childName = activeChild?.name ?? "siswa";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Observasi"
        description={`Catatan perilaku dan dukungan untuk ${childName}.`}
      />

      {children.length > 1 && (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-5">
          <Label htmlFor="student-select">Pilih siswa</Label>
          <Select value={childId ?? activeChild?.id} onValueChange={setChildId}>
            <SelectTrigger id="student-select" className="mt-2 max-w-sm rounded-xl">
              <SelectValue placeholder="Pilih siswa" />
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

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Tambah observasi</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {children.length > 1 && (
            <p className="text-xs text-muted-foreground">Untuk: {childName}</p>
          )}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul observasi"
            className="rounded-xl"
          />
          <Textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={4}
            placeholder="Perilaku atau interaksi yang diamati"
            className="rounded-xl"
          />
          <Textarea
            value={supportPlan}
            onChange={(e) => setSupportPlan(e.target.value)}
            rows={3}
            placeholder="Rencana dukungan (opsional)"
            className="rounded-xl"
          />
          <Button
            disabled={saving || !observation.trim()}
            className="rounded-full btn-brand border-0"
          >
            {saving ? "Menyimpan…" : "Simpan observasi"}
          </Button>
        </form>
      </Card>

      {observations.length === 0 ? (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Belum ada observasi untuk {childName}.
        </Card>
      ) : (
        <div className="space-y-4">
          {observations.map((item: any) => (
            <Card key={item.id} className="rounded-2xl border-border/60 bg-card/60 p-5">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[color:var(--brand)]" />
                <div className="font-medium">{item.title}</div>
              </div>
              {item.observed_at && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatShortDate(item.observed_at)}
                </div>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{item.observation}</p>
              {item.support_plan && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Dukungan: {item.support_plan}
                </p>
              )}
            </Card>
          ))}
        </div>
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
