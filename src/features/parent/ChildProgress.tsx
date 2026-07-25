import { useState } from "react";
import { ArrowLeft, ChevronRight, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import {
  formatShortDate,
  loadRoleDashboardData,
  loadRoleDetailData,
  useSociovaQuery,
} from "@/lib/sociova-data";

function Score({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl bg-background/40 p-4">
      <div className="font-display text-2xl font-bold">{value ?? 0}%</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function State({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card className="rounded-2xl p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

export function ChildProgress() {
  const summary = useSociovaQuery(() => loadRoleDashboardData("parent"));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (summary.loading) {
    return <State title="Memuat progress" description="Menyiapkan daftar anak Anda." />;
  }
  if (summary.error) {
    return <State title="Progress tidak tersedia" description={summary.error} />;
  }

  const children = summary.data?.children ?? [];
  const progressByChild = summary.data?.progressByChild ?? {};

  if (!children.length) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Progress Anak"
          description="Belum ada akun anak. Buat dulu di menu Kelola Anak."
        />
      </div>
    );
  }

  const showList = children.length > 1 && !selectedId;
  const activeId = selectedId ?? (children.length === 1 ? children[0].id : null);

  if (showList) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Progress Anak"
          description="Pilih anak untuk melihat capaian keterampilan dan laporan mingguan."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child: any) => {
            const progress = progressByChild[child.id] ?? {};
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedId(child.id)}
                className="text-left"
              >
                <Card className="group rounded-2xl border-border/60 bg-card/60 p-6 transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand)]/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-xl font-bold">{child.name}</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {child.age ?? "—"} tahun · {child.diagnosis_level ?? "Belum diisi"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[color:var(--brand)]" />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-xl bg-background/40 p-3">
                      <div className="font-display text-lg font-bold">
                        {progress.communication_score ?? 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Komunikasi</div>
                    </div>
                    <div className="rounded-xl bg-background/40 p-3">
                      <div className="font-display text-lg font-bold">
                        {progress.confidence_score ?? 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Percaya diri</div>
                    </div>
                    <div className="rounded-xl bg-background/40 p-3">
                      <div className="font-display text-lg font-bold">
                        {progress.empathy_score ?? 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Empati</div>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <ChildDetailView
      childId={activeId!}
      showBack={children.length > 1}
      onBack={() => setSelectedId(null)}
      summaryProgress={progressByChild}
    />
  );
}

function ChildDetailView({
  childId,
  showBack,
  onBack,
  summaryProgress,
}: {
  childId: string;
  showBack: boolean;
  onBack: () => void;
  summaryProgress: Record<string, any>;
}) {
  const detail = useSociovaQuery(() => loadRoleDetailData(childId), [childId]);

  if (detail.loading) {
    return <State title="Memuat detail" description="Mengambil capaian dan laporan mingguan." />;
  }
  if (detail.error) {
    return <State title="Detail tidak tersedia" description={detail.error} />;
  }

  const child = detail.data?.child;
  const progress = child
    ? (summaryProgress[child.id] ?? detail.data?.progress ?? {})
    : {};
  const weekly = detail.data?.weekly ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={child?.name ? `Progress ${child.name}` : "Progress Anak"}
        description="Capaian keterampilan sosial dan ringkasan perkembangan mingguan."
        actions={
          showBack ? (
            <Button variant="outline" className="rounded-full" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Semua anak
            </Button>
          ) : undefined
        }
      />

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-2xl font-bold">{child?.name ?? "—"}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {child?.age ?? "—"} tahun · {child?.diagnosis_level ?? "Belum diisi"}
            </p>
          </div>
          <UserRound className="h-6 w-6 text-[color:var(--brand)]" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {child?.learning_goal ?? "Belum ada tujuan belajar."}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Score
            label="Komunikasi"
            value={progress.communication_score ?? progress.communicationScore}
          />
          <Score
            label="Kepercayaan diri"
            value={progress.confidence_score ?? progress.confidenceScore}
          />
          <Score label="Empati" value={progress.empathy_score ?? progress.empathyScore} />
        </div>
      </Card>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Laporan mingguan</h2>
        <div className="mt-4 space-y-3">
          {weekly.length ? (
            weekly.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-border/60 p-3">
                <div className="text-sm font-medium">
                  {item.week_start
                    ? formatShortDate(item.week_start)
                    : "Perkembangan mingguan"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Komunikasi {item.communication_score ?? 0}% · Percaya diri{" "}
                  {item.confidence_score ?? 0}% · Empati {item.empathy_score ?? 0}% · Aktivitas{" "}
                  {item.completed_activities ?? 0}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.summary ?? "Belum ada ringkasan."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data mingguan.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
