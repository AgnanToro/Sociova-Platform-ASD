import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import { loadWeeklyReport, useSociovaQuery, formatShortDate } from "@/lib/sociova-data";
import { useAuth } from "@/lib/auth";
import { downloadWeeklyReportPdf, normalizeReportPayload } from "@/lib/weekly-report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_NICE: Record<string, string> = {
  parent: "Orang Tua",
  teacher: "Guru",
  therapist: "Terapis",
  child: "Anak",
  admin: "Admin",
};

export function ReportPage() {
  const { user, role } = useAuth();
  const [childId, setChildId] = useState<string>();
  const [downloading, setDownloading] = useState(false);
  const { data, loading, error } = useSociovaQuery(() => loadWeeklyReport(childId), [childId]);

  const downloadPdf = async () => {
    if (!data) {
      toast.error("Laporan belum siap");
      return;
    }
    setDownloading(true);
    try {
      await downloadWeeklyReportPdf({
        childName: data?.child?.name ?? "Anak",
        role: role ?? data?.role ?? "-",
        generatedBy: user?.fullName ?? data?.generated_by ?? "-",
        generatedAt: data?.generated_at ?? new Date().toISOString(),
        progress: data?.progress,
        weekly: data?.weekly ?? [],
        activities: data?.activities ?? [],
        observations: data?.observations ?? [],
        notes: data?.notes ?? [],
        recommendations: data?.recommendations ?? [],
      });
      toast.success("PDF berhasil diunduh");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <State title="Menyiapkan laporan" description="Mengambil data perkembangan anak." />;
  }
  if (error) {
    return <State title="Laporan tidak tersedia" description={error} />;
  }

  const report = normalizeReportPayload({
    childName: data?.child?.name ?? "Anak",
    role: role ?? data?.role ?? "-",
    generatedBy: user?.fullName ?? data?.generated_by ?? "-",
    generatedAt: data?.generated_at ?? new Date().toISOString(),
    progress: data?.progress,
    weekly: data?.weekly ?? [],
    activities: data?.activities ?? [],
    observations: data?.observations ?? [],
    notes: data?.notes ?? [],
    recommendations: data?.recommendations ?? [],
  });

  const roleLabel = ROLE_NICE[role ?? ""] ?? role ?? "Pengguna";

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Laporan Mingguan"
        description={`Ringkasan perkembangan ${report.childName} minggu ini.`}
        actions={
          <Button
            className="rounded-full btn-brand border-0"
            onClick={() => void downloadPdf()}
            disabled={downloading || loading}
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {downloading ? "Menyiapkan…" : "Unduh PDF"}
          </Button>
        }
      />

      {(data?.children?.length ?? 0) > 1 && (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-5">
          <label className="text-sm font-medium" htmlFor="report-child">
            Pilih anak
          </label>
          <Select value={data?.child?.id ?? childId} onValueChange={setChildId}>
            <SelectTrigger id="report-child" className="mt-2 max-w-sm rounded-xl">
              <SelectValue placeholder="Pilih anak" />
            </SelectTrigger>
            <SelectContent>
              {data.children.map((child: { id: string; name: string }) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      <Card className="rounded-2xl border-border/60 bg-card/60 p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-[color:var(--brand)]" />
          <div className="text-sm text-muted-foreground">
            Ringkasan otomatis perkembangan{" "}
            <strong className="text-foreground">{report.childName}</strong> dari data latihan,
            catatan guru, dan terapis. Dibuka oleh{" "}
            <strong className="text-foreground">{report.generatedBy}</strong> ({roleLabel}).
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Level" value={String(report.progress.level)} />
        <Metric label="XP" value={String(report.progress.xp)} />
        <Metric label="Streak" value={`${report.progress.streak} hari`} />
        <Metric label="Komunikasi" value={`${report.progress.communication}%`} />
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Ringkasan capaian</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Kepercayaan diri {report.progress.confidence}% · Empati {report.progress.empathy}%
        </p>
      </Card>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Progres mingguan</h2>
        <div className="mt-4 space-y-3">
          {report.weekly.length ? (
            report.weekly.map((item, index) => (
              <div
                key={`${item.weekStart}-${index}`}
                className="rounded-xl border border-border/60 bg-background/30 p-3"
              >
                <div className="text-sm font-medium">
                  {typeof item.weekStart === "string" && item.weekStart.includes("T")
                    ? formatShortDate(item.weekStart)
                    : String(item.weekStart)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Komunikasi {item.communication}% · Percaya diri {item.confidence}% · Empati{" "}
                  {item.empathy}% · Aktivitas {item.completed}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data mingguan.</p>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard
          title="Aktivitas terbaru"
          items={report.activities.map((a) => ({ title: a.title, text: a.detail }))}
        />
        <ListCard title="Catatan guru" items={report.observations} />
        <ListCard title="Catatan terapis" items={report.notes} />
        <ListCard title="Rekomendasi" items={report.recommendations} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}

function ListCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; text: string }>;
}) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="rounded-xl border border-border/60 bg-background/30 p-3"
            >
              <div className="font-medium">{item.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{item.text || "-"}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada data.</p>
        )}
      </div>
    </Card>
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
