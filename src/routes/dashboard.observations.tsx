import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import {
  createObservation,
  formatShortDate,
  loadRoleDetailData,
  useSociovaQuery,
} from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/observations")({
  head: () => ({ meta: [{ title: "Observations · Sociova" }] }),
  component: ObservationsPage,
});

function ObservationsPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadRoleDetailData);
  const [title, setTitle] = useState("Observasi kelas");
  const [observation, setObservation] = useState("");
  const [supportPlan, setSupportPlan] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!observation.trim()) return;
    setSaving(true);
    try {
      await createObservation({
        title: title.trim() || "Observasi kelas",
        observation: observation.trim(),
        support_plan: supportPlan.trim() || undefined,
      });
      toast.success("Observasi disimpan");
      setObservation("");
      setSupportPlan("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan observasi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <State title="Loading observations" description="Memuat catatan observasi kelas." />;
  if (error) return <State title="Observations unavailable" description={error} />;

  const observations = data?.observations ?? [];
  const child = data?.child;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Observations"
        description={
          child
            ? `Catatan observasi perilaku dan dukungan untuk ${child.name}.`
            : "Catatan observasi perilaku siswa di kelas."
        }
      />

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Tambah observasi</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul observasi" className="rounded-xl" />
          <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={4} placeholder="Tuliskan perilaku atau interaksi yang diamati..." className="rounded-xl" />
          <Textarea value={supportPlan} onChange={(e) => setSupportPlan(e.target.value)} rows={3} placeholder="Rencana dukungan (opsional)" className="rounded-xl" />
          <Button disabled={saving || !observation.trim()} className="rounded-full btn-brand border-0">
            {saving ? "Menyimpan..." : "Simpan observasi"}
          </Button>
        </form>
      </Card>

      {observations.length === 0 ? (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Belum ada observasi. Observasi baru akan tampil di sini.
        </Card>
      ) : (
        <div className="space-y-4">
          {observations.map((item: any) => (
            <Card key={item.id} className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <ClipboardList className="mt-0.5 h-4 w-4 text-[color:var(--brand)]" />
                <div>
                  <h2 className="font-display text-lg font-bold">{item.title}</h2>
                  {item.observed_at && (
                    <p className="mt-1 text-xs text-muted-foreground">{formatShortDate(item.observed_at)}</p>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{item.observation}</p>
              {item.support_plan && (
                <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Rencana dukungan</div>
                  <p className="mt-1 text-sm">{item.support_plan}</p>
                </div>
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
