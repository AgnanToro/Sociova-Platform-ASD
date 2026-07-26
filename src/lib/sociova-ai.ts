import { getScenarioScript } from "@/lib/simulation-scenes";

export type EmotionResult = {
  label: string;
  confidence: number;
  rec: string;
  scores: Array<{ l: string; v: number; c: string }>;
};

const RULES: Array<{ label: string; keywords: string[]; rec: string; color: string }> = [
  {
    label: "Cemas",
    keywords: ["cemas", "gugup", "takut", "khawatir", "deg-degan", "gelisah", "panik", "aneh", "perut"],
    rec: "Kamu terlihat cemas. Yuk tarik napas pelan 4 detik, tahan 4 detik, lalu hembuskan. Setelah itu sebutkan satu hal yang membuatmu lebih tenang.",
    color: "var(--warning)",
  },
  {
    label: "Sedih",
    keywords: ["sedih", "kecewa", "nangis", "menangis", "sendiri", "kesepian", "galau", "berat"],
    rec: "Rasa sedih itu wajar. Coba ceritakan perasaamu pada orang dewasa yang kamu percaya, atau tulis satu hal baik yang terjadi hari ini.",
    color: "var(--brand)",
  },
  {
    label: "Marah",
    keywords: ["marah", "kesal", "jengkel", "benci", "geregetan", "emosi", "sebel"],
    rec: "Saat marah, langkah aman adalah berhenti sejenak. Hitung sampai 5, genggam tangan pelan, lalu katakan apa yang membuatmu tidak nyaman.",
    color: "var(--destructive)",
  },
  {
    label: "Senang",
    keywords: ["senang", "bahagia", "seneng", "gembira", "bangga", "seru", "hebat", "berhasil"],
    rec: "Bagus sekali! Simpan momen ini. Kamu bisa bagikan kebanggaanmu ke orang tua atau teman dengan satu kalimat sederhana.",
    color: "var(--success)",
  },
  {
    label: "Tenang",
    keywords: ["tenang", "santai", "nyaman", "aman", "baik-baik", "oke", "siap"],
    rec: "Bagus, tubuhmu terasa lebih tenang. Pertahankan ritme napas pelan dan lanjutkan aktivitas dengan tempo nyaman.",
    color: "var(--success)",
  },
];

export function analyzeEmotion(inputText: string): EmotionResult {
  const text = (inputText || "").toLowerCase();
  const raw = RULES.map((rule) => {
    const hits = rule.keywords.filter((word) => text.includes(word)).length;
    return { ...rule, hits };
  });
  const ranked = raw.sort((a, b) => b.hits - a.hits);
  const best = ranked[0]?.hits
    ? ranked[0]
    : { ...RULES[0], hits: 0 };
  const scores = RULES.map((rule) => {
    const hits = rule.keywords.filter((word) => text.includes(word)).length;
    const base = rule.label === best.label ? 58 : 12;
    const value = Math.min(96, base + hits * 18 + (rule.label === best.label ? 8 : 0));
    return { l: rule.label, v: hits ? value : Math.max(8, Math.round(value * 0.35)), c: rule.color };
  }).sort((a, b) => b.v - a.v);

  const confidence = Math.min(96, 62 + (best.hits || 1) * 12 + Math.min(12, text.length / 20));
  return {
    label: best.label,
    confidence: Math.round(confidence),
    rec: best.rec,
    scores: scores.map((item) =>
      item.l === best.label ? { ...item, v: Math.round(confidence) } : item,
    ),
  };
}

export function scoreSimulation(params: {
  scenario: string;
  conversation: Array<{ from: "ai" | "me"; text: string }>;
  score?: number;
  feedback?: string;
}) {
  const script = getScenarioScript(params.scenario);
  const replies = params.conversation
    .filter((item) => item.from === "me")
    .map((item) => item.text.trim())
    .filter(Boolean);

  // Prefer client game score when provided (step-based mini-game)
  if (typeof params.score === "number" && Number.isFinite(params.score)) {
    const score = Math.max(0, Math.min(100, Math.round(params.score)));
    return {
      score,
      strength: score >= 80 ? "Pilihan sosialmu sudah tepat." : "Kamu sudah berani mencoba.",
      suggestion: score >= 80 ? "Main level lain untuk naik XP." : "Coba lagi dan pilih yang lebih aman/sopan.",
      feedback: params.feedback || `Skor game ${score}%. Skenario: ${script.title}.`,
      aiReply: script.opening,
      nextChoices: script.defaultChoices,
      scene: script.scene,
      role: script.role,
    };
  }

  let score = 55;
  const polite = ["halo", "hai", "terima kasih", "tolong", "boleh", "permisi", "maaf", "senang", "baik"];
  const politeHits = polite.filter((word) => replies.join(" ").toLowerCase().includes(word)).length;
  score += Math.min(20, politeHits * 5);
  score += Math.min(20, replies.length * 5);
  if (!replies.length) score = 40;
  score = Math.max(40, Math.min(98, score));

  return {
    score,
    strength: "Kamu sudah menyelesaikan latihan.",
    suggestion: "Main mode game pilihan untuk skor lebih akurat.",
    feedback: params.feedback || `Skor latihan ${score}%.`,
    aiReply: script.opening,
    nextChoices: script.defaultChoices,
    scene: script.scene,
    role: script.role,
  };
}

export function generateSocialStory(situation: string) {
  const clean = (situation || "").trim();
  const title = clean.length > 42 ? `${clean.slice(0, 42)}...` : clean || "Cerita Sosial Baru";
  const story = [
    `Situasi: ${clean || "Ada momen sosial baru yang ingin dilatih."}`,
    "",
    "Aku bisa berhenti sejenak dan menarik napas pelan.",
    "Aku boleh mengamati dulu apa yang terjadi di sekitarku.",
    "Lalu aku bisa memakai kalimat sederhana, misalnya: Halo, boleh aku ikut? atau Bu, tolong bantu saya.",
    "Jika aku merasa gugup, aku bisa meminta waktu atau bantuan orang dewasa.",
    "Setelah selesai, aku bisa bilang terima kasih. Langkah kecil ini membantu aku lebih percaya diri.",
  ].join("\n");
  return { title, generatedStory: story };
}

export function buildWeeklyBars(activities: Array<{ completedAt: Date | string; score?: number | null }>) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return labels.map((d, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const dayItems = activities.filter((item) => {
      const date = new Date(item.completedAt);
      return date >= day && date < next;
    });
    const xp = dayItems.reduce((sum, item) => sum + Math.max(20, item.score ?? 40), 0);
    return { d, xp, count: dayItems.length };
  });
}
