/** Preset social stories for children — tap to read, no typing required. */

export type StoryPreset = {
  id: string;
  title: string;
  situation: string;
  icon: "school" | "swing" | "bus" | "hello" | "queue" | "party";
  color: string;
  pages: string[];
};

export const STORY_PRESETS: StoryPreset[] = [
  {
    id: "sekolah-baru",
    title: "Hari Pertama di Sekolah",
    situation: "Bimo merasa gugup di hari pertamanya masuk sekolah baru.",
    icon: "school",
    color: "var(--brand)",
    pages: [
      "Hari ini aku masuk sekolah baru. Perutku terasa aneh. Itu wajar.",
      "Aku bisa tarik napas pelan. Satu... dua... tiga... empat.",
      "Aku boleh menyapa: Halo, namaku Bimo. Senang bertemu.",
      "Kalau bingung, aku bisa minta tolong ke Bu Guru.",
      "Satu langkah kecil sudah cukup. Aku hebat hari ini.",
    ],
  },
  {
    id: "giliran-ayunan",
    title: "Menunggu Giliran Bermain",
    situation: "Bimo ingin memakai ayunan, tetapi ada teman yang sedang bermain.",
    icon: "swing",
    color: "var(--success)",
    pages: [
      "Aku ingin naik ayunan. Teman sedang bermain di sana.",
      "Aku bisa menunggu di barisan. Menunggu itu baik.",
      "Aku bilang: Boleh aku main setelahmu?",
      "Saat giliran datang, aku naik pelan-pelan.",
      "Selesai main, aku bilang terima kasih. Teman senang.",
    ],
  },
  {
    id: "naik-bus",
    title: "Naik Bus ke Sekolah",
    situation: "Bimo belajar naik bus dengan aman bersama orang dewasa.",
    icon: "bus",
    color: "var(--warning)",
    pages: [
      "Aku mau naik bus. Aku menunggu di halte, bukan di jalan.",
      "Bus berhenti. Aku naik pelan-pelan.",
      "Aku duduk tenang dan pegang pegangan.",
      "Kalau bingung, aku bisa tanya: Apakah bus ini ke sekolah?",
      "Sampai tujuan, aku turun pelan. Aku aman.",
    ],
  },
  {
    id: "menyapa-teman",
    title: "Menyapa Teman Baru",
    situation: "Bimo ingin menyapa teman yang belum dikenal di taman bermain.",
    icon: "hello",
    color: "var(--brand)",
    pages: [
      "Ada anak di taman. Aku ingin kenalan.",
      "Aku bisa bilang: Halo, boleh main bareng?",
      "Kalau dia bilang boleh, kita main pelan-pelan.",
      "Kalau dia bilang tidak, aku tidak apa-apa. Aku main yang lain.",
      "Menyapa adalah langkah berani. Aku sudah mencoba.",
    ],
  },
  {
    id: "antre-kantin",
    title: "Antre di Kantin",
    situation: "Bimo lapar dan ingin membeli roti, tapi harus antre dulu.",
    icon: "queue",
    color: "var(--warning)",
    pages: [
      "Aku lapar. Aku mau beli roti di kantin.",
      "Ada barisan. Aku berdiri di belakang dengan tertib.",
      "Giliran tiba. Aku bilang: Saya mau roti, Bu.",
      "Aku bayar dan bilang terima kasih.",
      "Antre membuat semuanya adil. Aku hebat.",
    ],
  },
  {
    id: "pesta-ulang-tahun",
    title: "Di Pesta Ulang Tahun",
    situation: "Bimo diundang ke pesta dan belajar mengucapkan selamat.",
    icon: "party",
    color: "var(--success)",
    pages: [
      "Aku datang ke pesta. Ada balon dan kue.",
      "Aku bilang: Selamat ulang tahun!",
      "Aku boleh main bersama. Aku berbagi mainan.",
      "Saat tiup lilin, aku ikut menyanyi.",
      "Sebelum pulang, aku bilang terima kasih. Pesta seru!",
    ],
  },
];

export function getStoryPreset(id: string) {
  return STORY_PRESETS.find((s) => s.id === id) ?? STORY_PRESETS[0];
}
