/** Shared kid-friendly gamification helpers (tap-first, typing optional). */

export type EmotionFace = {
  id: string;
  label: string;
  /** Lucide icon name key used by EmotionPage */
  icon: "smile" | "meh" | "frown" | "angry" | "heart";
  prompt: string;
  color: string;
};

export const EMOTION_FACES: EmotionFace[] = [
  {
    id: "senang",
    label: "Senang",
    icon: "smile",
    prompt: "Aku merasa senang hari ini.",
    color: "var(--success)",
  },
  {
    id: "tenang",
    label: "Tenang",
    icon: "meh",
    prompt: "Aku merasa tenang dan nyaman.",
    color: "var(--success)",
  },
  {
    id: "cemas",
    label: "Cemas",
    icon: "frown",
    prompt: "Aku merasa cemas dan deg-degan.",
    color: "var(--warning)",
  },
  {
    id: "sedih",
    label: "Sedih",
    icon: "frown",
    prompt: "Aku merasa sedih hari ini.",
    color: "var(--brand)",
  },
  {
    id: "marah",
    label: "Marah",
    icon: "angry",
    prompt: "Aku merasa marah dan kesal.",
    color: "var(--destructive)",
  },
];

export type MissionStepDef = {
  id: string;
  title: string;
  icon: "hand" | "heart" | "bot" | "wind";
  hint: string;
  href?: string;
};

export const DEFAULT_MISSION_STEPS: MissionStepDef[] = [
  {
    id: "sapa",
    title: "Main bareng Sova",
    icon: "bot",
    hint: "Selesaikan satu game ngobrol",
    href: "/dashboard/child/simulation",
  },
  {
    id: "emosi",
    title: "Cerita perasaan",
    icon: "heart",
    hint: "Pilih wajah perasaanmu hari ini",
    href: "/dashboard/child/emotion",
  },
  {
    id: "cerita",
    title: "Baca cerita",
    icon: "hand",
    hint: "Baca satu cerita sosial sampai selesai",
    href: "/dashboard/child/story",
  },
  {
    id: "latihan",
    title: "Satu langkah lagi",
    icon: "wind",
    hint: "Main game atau catat perasaan sekali lagi",
    href: "/dashboard/child/simulation",
  },
];

export const BADGE_CATALOG = [
  {
    key: "first_hello",
    name: "Sapaan Pertama",
    description: "Selesaikan 1 simulasi sosial",
    icon: "hand",
    minSessions: 1,
  },
  {
    key: "emotion_scout",
    name: "Penjelajah Emosi",
    description: "Catat perasaan 3 kali",
    icon: "heart",
    minEmotions: 3,
  },
  {
    key: "streak_3",
    name: "Api 3 Hari",
    description: "Streak 3 hari berturut-turut",
    icon: "flame",
    minStreak: 3,
  },
  {
    key: "level_5",
    name: "Level 5",
    description: "Capai level 5",
    icon: "star",
    minLevel: 5,
  },
  {
    key: "mission_hero",
    name: "Pahlawan Misi",
    description: "Selesaikan 5 langkah misi",
    icon: "award",
    minMissions: 5,
  },
  {
    key: "journey_star",
    name: "Bintang Perjalanan",
    description: "Selesaikan 1 level journey",
    icon: "map",
    minJourney: 1,
  },
] as const;

export function xpToLevel(xp: number) {
  return Math.max(1, Math.floor(Math.max(0, xp) / 250) + 1);
}

export function xpToCoins(xp: number) {
  return Math.floor(Math.max(0, xp) / 8);
}

export function levelProgress(xp: number) {
  const inLevel = Math.max(0, xp) % 250;
  return {
    current: inLevel,
    needed: 250,
    percent: Math.round((inLevel / 250) * 100),
    level: xpToLevel(xp),
  };
}

export function missionStepsFor(targetCount?: number | null): MissionStepDef[] {
  const n = Math.max(1, Math.min(targetCount ?? 4, DEFAULT_MISSION_STEPS.length));
  return DEFAULT_MISSION_STEPS.slice(0, n);
}
