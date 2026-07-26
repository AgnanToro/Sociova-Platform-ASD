/** Built-in resource bodies shown in the in-app modal. */

export type SovaLessonKind =
  | "neutral"
  | "conversation"
  | "breathing"
  | "emotions"
  | "story"
  | "sensory";

export type ResourceBody = {
  title: string;
  category: string;
  bodyHtml: string;
  /** In-app cartoon animation with Sova (no YouTube). */
  lesson?: SovaLessonKind;
  /** Uploaded photo/video path or external media URL. */
  mediaUrl?: string | null;
  mediaKind?: "image" | "video" | null;
};

const LIBRARY: Record<string, ResourceBody> = {
  "Memahami Sensitivitas Sensorik pada Anak ASD": {
    title: "Memahami Sensitivitas Sensorik pada Anak ASD",
    category: "Guide",
    lesson: "sensory",
    bodyHtml: `
      <h2>Apa itu sensitivitas sensorik?</h2>
      <p>Banyak anak dengan ASD merasakan suara, cahaya, sentuhan, atau bau lebih kuat (hipersensitif) atau lebih lemah (hiposensitif) dibanding anak lain.</p>
      <h2>Tanda yang sering muncul</h2>
      <ul>
        <li>Menutup telinga di tempat ramai</li>
        <li>Menolak pakaian tertentu karena tekstur</li>
        <li>Mencari gerakan (berputar, melompat) untuk menenangkan diri</li>
      </ul>
      <h2>Langkah praktis di rumah & sekolah</h2>
      <ol>
        <li>Catat pemicu yang membuat anak kewalahan.</li>
        <li>Sediakan ruang tenang singkat (5–10 menit).</li>
        <li>Gunakan isyarat visual sebelum pindah aktivitas.</li>
        <li>Diskusikan strategi yang sama antara orang tua dan guru.</li>
      </ol>
    `,
  },
  "Cara Melatih Percakapan yang Tenang": {
    title: "Cara Melatih Percakapan yang Tenang",
    category: "Video",
    lesson: "conversation",
    bodyHtml: `
      <h2>Latihan singkat (5–10 menit)</h2>
      <ol>
        <li>Pilih topik sederhana: makanan favorit, mainan, atau kegiatan hari ini.</li>
        <li>Orang dewasa memberi contoh kalimat pendek, lalu anak menirukan.</li>
        <li>Tunggu 5–10 detik sebelum membantu menjawab.</li>
        <li>Akhiri dengan pujian spesifik: “Kamu sudah menunggu giliran berbicara.”</li>
      </ol>
    `,
  },
  "Kartu Kosakata Emosi": {
    title: "Kartu Kosakata Emosi",
    category: "Worksheet",
    lesson: "emotions",
    bodyHtml: `
      <h2>Cara memakai kartu emosi</h2>
      <p>Cetak atau gambar 6 kartu: senang, sedih, marah, takut, kaget, tenang.</p>
      <h2>Latihan harian</h2>
      <ul>
        <li>Tanya: “Hari ini tubuhmu lebih dekat ke kartu yang mana?”</li>
        <li>Minta anak menunjuk, bukan harus menjelaskan panjang.</li>
        <li>Hubungkan ke situasi: “Saat menunggu giliran, kamu merasa…”</li>
      </ul>
      <h2>Template sederhana</h2>
      <p><strong>Aku merasa:</strong> _________<br/>
      <strong>Karena:</strong> _________<br/>
      <strong>Aku bisa:</strong> tarik napas / minta bantuan / istirahat sebentar</p>
    `,
  },
  "Panduan Social Story untuk Rutinitas Baru": {
    title: "Panduan Social Story untuk Rutinitas Baru",
    category: "Guide",
    lesson: "story",
    bodyHtml: `
      <h2>Apa itu social story?</h2>
      <p>Cerita pendek yang menjelaskan situasi sosial dengan bahasa sederhana dan langkah yang jelas.</p>
      <h2>Struktur 4 kalimat</h2>
      <ol>
        <li>Situasi: “Besok aku ke dokter gigi.”</li>
        <li>Perasaan: “Aku boleh merasa gugup.”</li>
        <li>Tindakan: “Aku bisa tarik napas dan duduk di kursi tunggu.”</li>
        <li>Hasil: “Dokter membantu agar gigiku sehat.”</li>
      </ol>
      <p>Baca bersama 1–2 hari sebelum aktivitas baru.</p>
    `,
  },
  "Latihan Napas 4-4-4 bersama Anak": {
    title: "Latihan Napas 4-4-4 bersama Anak",
    category: "Exercise",
    lesson: "breathing",
    bodyHtml: `
      <h2>Cara melakukan</h2>
      <ol>
        <li>Tarik napas pelan sambil hitung 1–2–3–4.</li>
        <li>Tahan sebentar sambil hitung 1–2–3–4.</li>
        <li>Hembuskan pelan sambil hitung 1–2–3–4.</li>
      </ol>
      <p>Ulangi 3 kali sebelum sekolah, presentasi, atau situasi ramai. Lakukan dulu bersama orang dewasa.</p>
    `,
  },
  "Checklist Komunikasi Rumah dan Sekolah": {
    title: "Checklist Komunikasi Rumah dan Sekolah",
    category: "Checklist",
    bodyHtml: `
      <h2>Untuk orang tua (mingguan)</h2>
      <ul>
        <li>☐ Anak menjawab sapaan minimal 1x sehari</li>
        <li>☐ Anak meminta bantuan dengan kata/isyarat</li>
        <li>☐ Anak menunggu giliran dalam permainan</li>
      </ul>
      <h2>Untuk guru (mingguan)</h2>
      <ul>
        <li>☐ Bergabung dalam aktivitas kelompok singkat</li>
        <li>☐ Mengikuti 1 instruksi visual</li>
        <li>☐ Menunjukkan strategi menenangkan diri</li>
      </ul>
      <p>Centang yang muncul, lalu bagikan ringkas ke care team di Sociova.</p>
    `,
  },
};

export const LESSON_OPTIONS: Array<{
  id: SovaLessonKind;
  label: string;
  hint: string;
}> = [
  { id: "neutral", label: "Sova (default)", hint: "Animasi netral yang ramah" },
  { id: "conversation", label: "Percakapan", hint: "Sova ngobrol pelan" },
  { id: "breathing", label: "Napas 4-4-4", hint: "Animasi napas menenangkan" },
  { id: "emotions", label: "Emosi", hint: "Kartu perasaan" },
  { id: "story", label: "Cerita sosial", hint: "Langkah cerita singkat" },
  { id: "sensory", label: "Ruang tenang", hint: "Istirahat sensorik" },
];

const ALL_LESSONS: SovaLessonKind[] = [
  "neutral",
  "conversation",
  "breathing",
  "emotions",
  "story",
  "sensory",
];

const LESSON_PREFIX = "sova-lesson:";

export function encodeLessonUrl(lesson: SovaLessonKind | "" | null | undefined): string | null {
  if (!lesson) return null;
  return `${LESSON_PREFIX}${lesson}`;
}

export function parseLessonFromUrl(url?: string | null): SovaLessonKind | undefined {
  if (!url?.startsWith(LESSON_PREFIX)) return undefined;
  const kind = url.slice(LESSON_PREFIX.length) as SovaLessonKind;
  if (ALL_LESSONS.includes(kind)) return kind;
  return undefined;
}

function detectMedia(url?: string | null): {
  mediaUrl: string | null;
  mediaKind: "image" | "video" | null;
} {
  if (!url || url.startsWith(LESSON_PREFIX)) return { mediaUrl: null, mediaKind: null };
  const lower = url.toLowerCase();
  if (lower.startsWith("data:video") || /\.(mp4|webm|ogg)(\?|$)/i.test(lower)) {
    return { mediaUrl: url, mediaKind: "video" };
  }
  if (lower.startsWith("data:image") || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(lower)) {
    return { mediaUrl: url, mediaKind: "image" };
  }
  if (lower.startsWith("/uploads/")) {
    return { mediaUrl: url, mediaKind: "image" };
  }
  return { mediaUrl: null, mediaKind: null };
}

/** Escape + turn plain text / light markdown-ish lines into HTML for the modal. */
export function plainTextToHtml(text: string): string {
  const raw = (text ?? "").trim();
  if (!raw) return "<p class='text-muted'>Belum ada isi materi.</p>";
  // Already HTML from built-in library
  if (/<\s*(p|h[1-6]|ul|ol|li|div|br)\b/i.test(raw)) return raw;

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const blocks = raw.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      // Numbered steps
      if (lines.every((l) => /^\d+[\.\)]\s+/.test(l))) {
        const items = lines
          .map((l) => `<li>${escape(l.replace(/^\d+[\.\)]\s+/, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }
      // Bullets
      if (lines.every((l) => /^[-•*]\s+/.test(l))) {
        const items = lines
          .map((l) => `<li>${escape(l.replace(/^[-•*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      // Heading-ish short line
      if (lines.length === 1 && lines[0].length < 60 && !/[.!?]$/.test(lines[0])) {
        return `<h2>${escape(lines[0])}</h2>`;
      }
      return `<p>${lines.map(escape).join("<br/>")}</p>`;
    })
    .join("\n");
}

/** One-line / short blurb for resource cards. */
export function resourceCardSummary(item: {
  description?: string | null;
  body?: string | null;
}): string {
  const desc = (item.description ?? "").trim();
  if (desc) {
    // Prefer first sentence / first ~140 chars for card
    const first = desc.split(/\n+/)[0]?.trim() ?? desc;
    if (first.length <= 160) return first;
    return `${first.slice(0, 157).trim()}…`;
  }
  const body = (item.body ?? "").trim();
  if (!body) return "Belum ada ringkasan.";
  const first = body.split(/\n+/)[0]?.trim() ?? body;
  if (first.length <= 160) return first;
  return `${first.slice(0, 157).trim()}…`;
}

export function resolveResourceContent(item: {
  title?: string;
  category?: string;
  description?: string;
  body?: string | null;
  url?: string | null;
}): ResourceBody {
  const known = item.title ? LIBRARY[item.title] : undefined;
  const media = detectMedia(item.url);
  const lessonFromUrl = parseLessonFromUrl(item.url);
  if (known) {
    return {
      ...known,
      ...media,
      // Prefer explicit lesson from url (after edit), else built-in, else neutral
      lesson: lessonFromUrl ?? known.lesson ?? "neutral",
    };
  }

  // User materials: full `body` for modal; fall back to description if body empty
  const full = (item.body ?? "").trim() || (item.description ?? "");
  return {
    title: item.title ?? "Materi Sociova",
    category: item.category ?? "Guide",
    bodyHtml: plainTextToHtml(full),
    lesson: lessonFromUrl ?? (media.mediaUrl ? undefined : "neutral"),
    ...media,
  };
}
