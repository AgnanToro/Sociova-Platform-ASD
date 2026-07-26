import type { AuthRole } from "@/lib/roles";

export type WeeklyReportData = {
  childName: string;
  role: AuthRole | string;
  generatedBy: string;
  generatedAt: string;
  progress: any;
  weekly: any[];
  activities: any[];
  observations: any[];
  notes: any[];
  recommendations: any[];
};

function val(obj: any, a: string, b: string, fallback: any = 0) {
  return obj?.[a] ?? obj?.[b] ?? fallback;
}

export function normalizeReportPayload(params: WeeklyReportData) {
  return {
    childName: params.childName,
    role: params.role,
    generatedBy: params.generatedBy,
    generatedAt: params.generatedAt || new Date().toISOString(),
    progress: {
      level: val(params.progress, "level", "level", 1),
      xp: val(params.progress, "xp", "xp", 0),
      streak: val(params.progress, "streak", "streak", 0),
      communication: val(params.progress, "communication_score", "communicationScore", 0),
      confidence: val(params.progress, "confidence_score", "confidenceScore", 0),
      empathy: val(params.progress, "empathy_score", "empathyScore", 0),
    },
    weekly: (params.weekly ?? []).map((item) => ({
      weekStart: val(item, "week_start", "weekStart", "-"),
      communication: val(item, "communication_score", "communicationScore", 0),
      confidence: val(item, "confidence_score", "confidenceScore", 0),
      empathy: val(item, "empathy_score", "empathyScore", 0),
      completed: val(item, "completed_activities", "completedActivities", 0),
      summary: item.summary ?? "-",
    })),
    activities: (params.activities ?? []).slice(0, 8).map((item) => ({
      title: item.title,
      detail: item.detail ?? item.category ?? "",
      score: item.score ?? null,
    })),
    observations: (params.observations ?? []).slice(0, 6).map((item) => ({
      title: item.title,
      text: item.observation ?? "",
    })),
    notes: (params.notes ?? []).slice(0, 6).map((item) => ({
      title: item.title,
      text: item.note ?? "",
    })),
    recommendations: (params.recommendations ?? []).slice(0, 6).map((item) => ({
      title: item.title,
      text: item.description ?? "",
    })),
  };
}

export function buildWeeklyReportHtml(params: WeeklyReportData) {
  const data = normalizeReportPayload(params);
  const weekRows = data.weekly
    .map(
      (item) =>
        `<tr><td>${item.weekStart}</td><td>${item.communication}%</td><td>${item.confidence}%</td><td>${item.empathy}%</td><td>${item.completed}</td><td>${item.summary}</td></tr>`,
    )
    .join("");
  const list = (items: Array<{ title: string; text: string }>) =>
    items.map((item) => `<li><strong>${item.title}</strong>: ${item.text}</li>`).join("") ||
    "<li>Belum ada data</li>";

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Mingguan ${data.childName}</title>
  <style>
    body { font-family: Segoe UI, sans-serif; margin: 32px; color: #122; line-height: 1.5; }
    h1,h2 { margin: 0 0 8px; }
    .muted { color: #567; }
    .card { border: 1px solid #d8e0ea; border-radius: 12px; padding: 16px; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d8e0ea; padding: 8px; text-align: left; font-size: 13px; }
    th { background: #f4f7fb; }
    ul { margin: 8px 0 0 18px; }
  </style>
</head>
<body>
  <h1>Laporan Mingguan Sociova</h1>
  <p class="muted">Anak: <strong>${data.childName}</strong> · Dibuka oleh: ${data.generatedBy} (${data.role}) · ${new Date(data.generatedAt).toLocaleString("id-ID")}</p>
  <div class="card">
    <h2>Ringkasan Capaian</h2>
    <p>Level ${data.progress.level} · XP ${data.progress.xp} · Streak ${data.progress.streak} hari</p>
    <p>Komunikasi ${data.progress.communication}% · Kepercayaan diri ${data.progress.confidence}% · Empati ${data.progress.empathy}%</p>
  </div>
  <div class="card">
    <h2>Progres Mingguan</h2>
    <table>
      <thead><tr><th>Minggu</th><th>Komunikasi</th><th>Percaya Diri</th><th>Empati</th><th>Aktivitas</th><th>Ringkasan</th></tr></thead>
      <tbody>${weekRows || "<tr><td colspan='6'>Belum ada data mingguan</td></tr>"}</tbody>
    </table>
  </div>
  <div class="card"><h2>Aktivitas Terbaru</h2><ul>${list(data.activities.map((a) => ({ title: a.title, text: a.detail })))}</ul></div>
  <div class="card"><h2>Catatan Guru</h2><ul>${list(data.observations)}</ul></div>
  <div class="card"><h2>Catatan Terapis</h2><ul>${list(data.notes)}</ul></div>
  <div class="card"><h2>Rekomendasi</h2><ul>${list(data.recommendations)}</ul></div>
</body>
</html>`;
}

/** Build & trigger direct .pdf download (no print dialog). */
export async function downloadWeeklyReportPdf(params: WeeklyReportData) {
  const { jsPDF } = await import("jspdf");
  const data = normalizeReportPayload(params);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (need = 24) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (text: string, opts?: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number }) => {
    const size = opts?.size ?? 11;
    const gap = opts?.gap ?? 6;
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    if (opts?.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(18, 34, 34);
    const lines = doc.splitTextToSize(text, maxW) as string[];
    for (const line of lines) {
      ensureSpace(size + 6);
      doc.text(line, margin, y);
      y += size + 4;
    }
    y += gap;
  };

  const section = (title: string) => {
    ensureSpace(36);
    y += 8;
    write(title, { size: 13, bold: true, color: [30, 90, 160], gap: 4 });
  };

  const bulletList = (items: Array<{ title: string; text: string }>) => {
    if (!items.length) {
      write("Belum ada data.", { size: 10, color: [90, 110, 130] });
      return;
    }
    for (const item of items) {
      const body = item.text ? `${item.title}: ${item.text}` : item.title;
      write(`• ${body}`, { size: 10, gap: 2 });
    }
  };

  write("Laporan Mingguan Sociova", { size: 18, bold: true, color: [20, 60, 120], gap: 4 });
  write(
    `Anak: ${data.childName}  |  Dibuka oleh: ${data.generatedBy} (${data.role})  |  ${new Date(data.generatedAt).toLocaleString("id-ID")}`,
    { size: 10, color: [90, 110, 130], gap: 10 },
  );

  section("Ringkasan Capaian");
  write(
    `Level ${data.progress.level}  ·  XP ${data.progress.xp}  ·  Streak ${data.progress.streak} hari`,
    { size: 11 },
  );
  write(
    `Komunikasi ${data.progress.communication}%  ·  Kepercayaan diri ${data.progress.confidence}%  ·  Empati ${data.progress.empathy}%`,
    { size: 11 },
  );

  section("Progres Mingguan");
  if (!data.weekly.length) {
    write("Belum ada data mingguan.", { size: 10, color: [90, 110, 130] });
  } else {
    for (const w of data.weekly) {
      write(
        `${w.weekStart} — Komunikasi ${w.communication}% · Percaya diri ${w.confidence}% · Empati ${w.empathy}% · Aktivitas ${w.completed}`,
        { size: 10, gap: 1 },
      );
      if (w.summary && w.summary !== "-") {
        write(`  ${w.summary}`, { size: 9, color: [90, 110, 130], gap: 4 });
      }
    }
  }

  section("Aktivitas Terbaru");
  bulletList(data.activities.map((a) => ({ title: a.title, text: a.detail || "" })));

  section("Catatan Guru");
  bulletList(data.observations);

  section("Catatan Terapis");
  bulletList(data.notes);

  section("Rekomendasi");
  bulletList(data.recommendations);

  const safeName = data.childName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "anak";
  const datePart = new Date(data.generatedAt).toISOString().slice(0, 10);
  doc.save(`laporan-mingguan-${safeName}-${datePart}.pdf`);
}
