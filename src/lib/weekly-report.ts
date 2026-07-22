import type { AppRole } from "@/lib/roles";

export type WeeklyReportData = {
  childName: string;
  role: AppRole | string;
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
  <p class="muted">Anak: <strong>${data.childName}</strong> · Dibuat oleh: ${data.generatedBy} (${data.role}) · ${new Date(data.generatedAt).toLocaleString("id-ID")}</p>
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
