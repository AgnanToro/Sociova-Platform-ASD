import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import { loadWeeklyReport, useSociovaQuery, formatShortDate } from "@/lib/sociova-data";
import { useAuth } from "@/lib/auth";
import { normalizeReportPayload } from "@/lib/weekly-report";

export const Route = createFileRoute("/dashboard/report")({
  head: () => ({ meta: [{ title: "Weekly Report · Sociova" }] }),
  component: ReportPage,
});

function ReportPage() {
  const { user, role } = useAuth();
  const { data, loading, error } = useSociovaQuery(loadWeeklyReport);

  const downloadPdf = () => {
    if (!data?.html) {
      toast.error("Laporan belum siap");
      return;
    }
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=920,height=720");
    if (!printWindow) {
      toast.error("Popup diblokir browser. Izinkan popup untuk unduh PDF.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(data.html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
    toast.success("Pilih Save as PDF pada dialog print");
  };

  if (loading) {
    return <State title="Menyiapkan laporan" description="Mengambil data perkembangan dari MySQL." />;
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

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Laporan Mingguan"
        description={`Tampilan web laporan perkembangan ${report.childName}. Unduh PDF lewat tombol di kanan.`}
        actions={
          <Button className="rounded-full btn-brand border-0" onClick={downloadPdf}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        }
      />

      <Card className="rounded-2xl border-border/60 bg-card/60 p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-[color:var(--brand)]" />
          <div className="text-sm text-muted-foreground">
            Dibuat untuk <strong className="text-foreground">{report.childName}</strong> oleh{" "}
            <strong className="text-foreground">{report.generatedBy}</strong>
            {role ? ` (${role})` : ""}. Halaman ini adalah tampilan web; PDF hanya dibuat saat tombol Download diklik.
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
              <div key={`${item.weekStart}-${index}`} className="rounded-xl border border-border/60 bg-background/30 p-3">
                <div className="text-sm font-medium">
                  {typeof item.weekStart === "string" && item.weekStart.includes("T")
                    ? formatShortDate(item.weekStart)
                    : String(item.weekStart)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Komunikasi {item.communication}% · Percaya diri {item.confidence}% · Empati {item.empathy}% · Aktivitas {item.completed}
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
        <ListCard title="Aktivitas terbaru" items={report.activities.map((a) => ({ title: a.title, text: a.detail }))} />
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
            <div key={`${item.title}-${index}`} className="rounded-xl border border-border/60 bg-background/30 p-3">
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
