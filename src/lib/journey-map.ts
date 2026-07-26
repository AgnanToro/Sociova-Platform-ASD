/** Map Journey levels ↔ AI Simulation scenarios (1:1, no duplicates). */

export const JOURNEY_TO_SCENARIO: Record<string, string> = {
  "Mulai Menyapa": "Perkenalkan Dirimu",
  "Mengenal Emosi": "Pergi ke Dokter Gigi",
  "Bercerita Bergantian": "Berbicara dengan Guru",
  "Menjadi Teman": "Bertemu Teman Baru",
  Friendship: "Membeli Makanan di Kantin",
  Presentation: "Presentasi di Depan Kelas",
  "Real World": "Naik Transportasi Umum",
  Celebrate: "Menghadiri Pesta Ulang Tahun",
  "Membeli Makanan di Kantin": "Membeli Makanan di Kantin",
};

/** XP for free-play (no journey link): scales with difficulty 1–5 */
export function freePlayXp(difficulty: number) {
  return 30 + Math.max(1, Math.min(5, difficulty)) * 15;
}

export function scenarioForJourney(title: string): string {
  if (JOURNEY_TO_SCENARIO[title]) return JOURNEY_TO_SCENARIO[title];
  const key = Object.keys(JOURNEY_TO_SCENARIO).find(
    (k) => k.toLowerCase() === title.toLowerCase(),
  );
  return key ? JOURNEY_TO_SCENARIO[key] : "Perkenalkan Dirimu";
}

export function journeyTitlesForScenario(scenarioTitle: string): string[] {
  return Object.entries(JOURNEY_TO_SCENARIO)
    .filter(([, scenario]) => scenario.toLowerCase() === scenarioTitle.toLowerCase())
    .map(([journey]) => journey);
}

export function simulationPlayHref(opts: {
  scenario: string;
  journeyLevelId?: string | null;
}) {
  const params = new URLSearchParams();
  params.set("scenario", opts.scenario);
  if (opts.journeyLevelId) params.set("journey", opts.journeyLevelId);
  return `/dashboard/child/simulation?${params.toString()}`;
}

export function shuffleChoices<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
