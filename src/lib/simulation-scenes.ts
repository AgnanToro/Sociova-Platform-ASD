/** Step-based social mini-games — step count scales with difficulty / journey XP. */

export type GameChoice = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
};

export type GameStep = {
  prompt: string;
  hint?: string;
  choices: GameChoice[];
};

export type ScenarioGame = {
  title: string;
  scene: string;
  role: string;
  intro: string;
  /** Rough difficulty 1–5 (matches journey progression) */
  difficulty: number;
  steps: GameStep[];
  winMessage: string;
};

function c(
  id: string,
  text: string,
  correct: boolean,
  feedback: string,
): GameChoice {
  return { id, text, correct, feedback };
}

function step(prompt: string, choices: GameChoice[], hint?: string): GameStep {
  return { prompt, hint, choices };
}

export const SCENARIO_GAMES: ScenarioGame[] = [
  // ── Easy · 3 steps · ~100 XP (Mulai Menyapa) ──
  {
    title: "Perkenalkan Dirimu",
    scene: "intro",
    role: "Sova",
    difficulty: 1,
    intro: "Level mudah · 3 pertanyaan. Sova ingin kenalan.",
    winMessage: "Kamu berhasil berkenalan dengan Sova!",
    steps: [
      step(
        "Sova: Halo! Siapa namamu?",
        [
          c("a", "Namaku Bimo. Senang bertemu!", true, "Bagus! Menyebut nama dengan sapaan yang ramah."),
          c("b", "Tidak mau bilang.", false, "Kalau bisa, sebutkan namamu agar teman mengenalimu."),
          c("c", "Diam saja.", false, "Mencoba menjawab membantu percakapan berjalan."),
        ],
        "Sebutkan namamu dengan ramah.",
      ),
      step(
        "Sova: Senang kenalan! Kamu suka apa?",
        [
          c("a", "Aku suka main balok.", true, "Hebat! Berbagi hobi membuat teman lebih kenal."),
          c("b", "Urusanmu saja.", false, "Jawaban itu kurang ramah. Coba sebutkan hobi."),
          c("c", "Tidak tahu.", false, "Boleh pilih satu hal kecil yang kamu suka."),
        ],
        "Ceritakan hobi sederhana.",
      ),
      step("Sova: Terima kasih sudah berkenalan. Apa yang kamu ucapkan?", [
        c("a", "Terima kasih, Sova. Sampai jumpa!", true, "Sempurna. Menutup percakapan dengan sopan."),
        c("b", "Pergi saja.", false, "Lebih baik bilang terima kasih atau sampai jumpa."),
        c("c", "Hmm.", false, "Coba ucapkan terima kasih agar percakapan lengkap."),
      ]),
    ],
  },

  // ── Easy-medium · 4 steps · ~125 XP (Mengenal Emosi) ──
  {
    title: "Pergi ke Dokter Gigi",
    scene: "dentist",
    role: "Dokter Gigi",
    difficulty: 2,
    intro: "Level 2 · 4 pertanyaan. Sampaikan perasaanmu di klinik gigi.",
    winMessage: "Pemeriksaan selesai. Kamu berani!",
    steps: [
      step("Dokter: Halo, apa yang kamu rasakan hari ini?", [
        c("a", "Saya agak takut, Dok. Gigi saya sakit.", true, "Bagus jujur. Dokter jadi bisa membantu."),
        c("b", "Tidak mau dibuka mulutnya!", false, "Boleh takut, tapi coba bilang: Saya takut, boleh pelan-pelan?"),
        c("c", "Pulang saja.", false, "Ceritakan dulu rasanya, lalu dokter bantu pelan-pelan."),
      ]),
      step("Dokter: Tidak apa-apa merasa takut. Mau tarik napas dulu bareng?", [
        c("a", "Baik, Dok. Tarik napas pelan.", true, "Bagus! Mengatur napas membantu rasa takut."),
        c("b", "Tidak perlu, buruan saja.", false, "Napas pelan membuat tubuh lebih siap."),
        c("c", "Aku lari saja.", false, "Lebih aman tetap di kursi dan bilang kalau takut."),
      ]),
      step("Dokter: Buka mulut sedikit ya, pelan-pelan.", [
        c("a", "Baik, Dok. Pelan-pelan ya.", true, "Kerja sama yang bagus!"),
        c("b", "Tidak!", false, "Kalau takut, bilang: Tunggu sebentar, saya siap dulu."),
        c("c", "Sakit tidak sih? Aku tidak mau.", false, "Boleh tanya, lalu bilang siap. Contoh: Baik, Dok."),
      ]),
      step("Dokter: Sudah selesai. Kamu sangat berani!", [
        c("a", "Terima kasih, Dok.", true, "Sopan dan berani. Hebat!"),
        c("b", "Akhirnya.", false, "Hampir. Tambahkan terima kasih kepada dokter."),
        c("c", "Jangan panggil lagi.", false, "Lebih baik: Terima kasih, Dok. Sampai jumpa."),
      ]),
    ],
  },

  // ── Medium · 4 steps · ~150 XP (Bercerita Bergantian) ──
  {
    title: "Berbicara dengan Guru",
    scene: "classroom",
    role: "Bu Guru",
    difficulty: 2,
    intro: "Level 2 · 4 pertanyaan. Minta bantuan guru dengan sopan.",
    winMessage: "Kamu berhasil minta bantuan ke guru!",
    steps: [
      step("Bu Guru: Kelihatannya kamu ingin bertanya. Apa yang ingin kamu sampaikan?", [
        c("a", "Bu, boleh saya bertanya?", true, "Sopan sekali. Meminta izin dulu itu bagus."),
        c("b", "Bu, ini susah banget!", false, "Boleh bilang kesulitan, tapi mulai dengan: Boleh saya bertanya?"),
        c("c", "Saya tidak mau belajar.", false, "Coba minta bantuan: Bu, tolong bantu saya."),
      ]),
      step("Bu Guru: Tentu. Bagian mana yang belum kamu pahami?", [
        c("a", "Soal nomor dua, Bu. Saya belum paham.", true, "Jelas! Guru jadi tahu apa yang harus dibantu."),
        c("b", "Semuanya.", false, "Coba sebut satu bagian dulu, misalnya soal nomor dua."),
        c("c", "Tidak tahu.", false, "Tunjuk soal yang membingungkan, lalu minta dijelaskan."),
      ]),
      step("Bu Guru: Kita hitung pelan-pelan. Kamu bisa ikuti?", [
        c("a", "Siap, Bu. Terima kasih.", true, "Sikap siap belajar — hebat!"),
        c("b", "Cepat saja, Bu.", false, "Lebih baik bilang: Pelan-pelan ya, Bu. Terima kasih."),
        c("c", "Malas.", false, "Coba bilang siap dan terima kasih atas bantuannya."),
      ]),
      step("Bu Guru: Sudah lebih jelas? Ada lagi yang ingin ditanyakan?", [
        c("a", "Sudah jelas, Bu. Terima kasih banyak.", true, "Menutup dengan sopan. Bagus sekali."),
        c("b", "Ya sudah.", false, "Tambahkan terima kasih agar lebih sopan."),
        c("c", "Bu Guru jelek jelasinnya.", false, "Lebih baik bilang terima kasih meski masih belajar."),
      ]),
    ],
  },

  // ── Medium · 4 steps · ~175 XP (Menjadi Teman) ──
  {
    title: "Bertemu Teman Baru",
    scene: "playground",
    role: "Dika",
    difficulty: 3,
    intro: "Level 3 · 4 pertanyaan. Main bareng teman baru di taman.",
    winMessage: "Kamu punya teman baru! Main bareng Dika berhasil.",
    steps: [
      step("Dika: Halo, aku Dika. Boleh aku bermain bersamamu?", [
        c("a", "Halo Dika, boleh!", true, "Bagus! Menyambut teman baru dengan ramah."),
        c("b", "Jangan ganggu.", false, "Itu bisa menyakiti. Lebih baik bilang boleh atau tunggu sebentar."),
        c("c", "Siapa kamu? Pergi!", false, "Coba sapa dulu, misalnya: Halo, boleh."),
      ]),
      step("Dika: Asyik! Mau main balok atau ayunan?", [
        c("a", "Main balok yuk.", true, "Pilihan jelas membantu permainan dimulai."),
        c("b", "Terserah, aku bosan.", false, "Coba pilih satu agar teman tahu mau main apa."),
        c("c", "Aku tidak mau main denganmu.", false, "Kalau belum siap, bilang: Nanti saja, terima kasih."),
      ]),
      step("Dika: Menara kita roboh! Apa yang kamu lakukan?", [
        c("a", "Tidak apa-apa, kita bangun lagi.", true, "Hebat! Tetap tenang dan ajak kerja sama."),
        c("b", "Salahmu!", false, "Menyalahkan teman kurang baik. Ajak bangun lagi."),
        c("c", "Aku pulang saja.", false, "Coba selesaikan bersama dulu, lalu main lagi."),
      ]),
      step("Dika: Seru main bareng. Besok main lagi?", [
        c("a", "Boleh! Sampai jumpa, Dika.", true, "Menjaga pertemanan dengan janji yang ramah."),
        c("b", "Tidak. Kamu membosankan.", false, "Lebih baik: Nanti dulu ya, terima kasih."),
        c("c", "Diam dan pergi.", false, "Ucapkan sampai jumpa agar teman tidak bingung."),
      ]),
    ],
  },

  // ── Medium-hard · 5 steps · kantin ──
  {
    title: "Membeli Makanan di Kantin",
    scene: "canteen",
    role: "Ibu Kantin",
    difficulty: 3,
    intro: "Level 3 · 5 pertanyaan. Beli makanan di kantin dengan sopan.",
    winMessage: "Berhasil beli makanan dengan sopan!",
    steps: [
      step("Ibu Kantin: Halo, kamu ingin membeli apa hari ini?", [
        c("a", "Saya mau roti, Bu.", true, "Pesanan jelas dan sopan. Bagus!"),
        c("b", "Kasih makanan!", false, "Lebih sopan: Saya mau roti, Bu."),
        c("c", "Diam dan tunjuk saja.", false, "Mencoba bilang pesanan membantu ibu kantin."),
      ]),
      step("Ibu Kantin: Roti keju atau roti coklat?", [
        c("a", "Roti keju, Bu. Terima kasih.", true, "Memilih dengan jelas — hebat."),
        c("b", "Yang mana saja, cepat.", false, "Sebut pilihanmu: keju atau coklat."),
        c("c", "Keduanya gratis ya.", false, "Kita bayar makanan di kantin."),
      ]),
      step("Ibu Kantin: Harganya lima ribu. Silakan bayar.", [
        c("a", "Ini uangnya, Bu. Terima kasih.", true, "Bayar dan bilang terima kasih — sempurna."),
        c("b", "Mahal sekali!", false, "Kalau kurang uang, bilang: Maaf Bu, uang saya kurang."),
        c("c", "Ambil saja rotinya tanpa bayar.", false, "Kita harus bayar dulu. Itu aturan yang adil."),
      ]),
      step("Ibu Kantin: Kembalian dua ribu. Simpan baik-baik ya.", [
        c("a", "Baik, Bu. Terima kasih.", true, "Menerima kembalian dengan sopan."),
        c("b", "Kurang dong.", false, "Cek dulu pelan-pelan, lalu tanya sopan jika ragu."),
        c("c", "Buang saja uangnya.", false, "Simpan uang dengan hati-hati."),
      ]),
      step("Ibu Kantin: Nih rotinya. Ada lagi?", [
        c("a", "Cukup, Bu. Terima kasih!", true, "Menutup dengan sopan. Selamat makan!"),
        c("b", "Sudah.", false, "Hampir. Tambahkan terima kasih biar lebih sopan."),
        c("c", "Lambat sekali pelayanannya.", false, "Lebih baik berterima kasih atas bantuannya."),
      ]),
    ],
  },

  // ── Hard · 5 steps · ~200 XP (Presentation) ──
  {
    title: "Presentasi di Depan Kelas",
    scene: "presentation",
    role: "Teman kelas",
    difficulty: 4,
    intro: "Level 4 · 5 pertanyaan. Sapa, isi, jawab, tutup.",
    winMessage: "Presentasi selesai! Teman-teman bertepuk tangan.",
    steps: [
      step(
        "Saatnya mulai. Apa yang kamu katakan pertama?",
        [
          c("a", "Halo teman-teman.", true, "Benar! Sapaan membuka presentasi dengan baik."),
          c("b", "Cepat selesai saja.", false, "Mulai dengan: Halo teman-teman."),
          c("c", "Diam dan menunduk.", false, "Coba angkat kepala dan sapa dulu."),
        ],
        "Mulai dengan sapaan.",
      ),
      step(
        "Teman: Kami mendengarkan. Lanjutkan ceritamu.",
        [
          c("a", "Hari ini topik saya hewan. Hewan kesukaan saya kucing.", true, "Bagus! Topik dan isi sudah jelas."),
          c("b", "Pokoknya itu saja.", false, "Sebutkan topik, misalnya: Topik saya hewan."),
          c("c", "Saya lupa semuanya.", false, "Tarik napas. Bilang satu kalimat tentang topikmu."),
        ],
        "Sampaikan topik singkat.",
      ),
      step("Teman: Mengapa kamu suka kucing?", [
        c("a", "Karena kucing lucu dan lembut.", true, "Alasan singkat — bagus untuk presentasi."),
        c("b", "Tidak tahu, berhenti tanya.", false, "Coba jawab satu alasan sederhana."),
        c("c", "Bodoh sekali pertanyaanmu.", false, "Jawab dengan sopan, meski gugup."),
      ]),
      step("Kamu sedikit gugup. Apa yang membantu?", [
        c("a", "Tarik napas pelan, lalu lanjut bicara.", true, "Regulasi diri yang tepat. Hebat!"),
        c("b", "Lari keluar kelas.", false, "Lebih baik napas dulu di tempat."),
        c("c", "Marah ke teman yang melihat.", false, "Napas pelan membantu rasa gugup."),
      ]),
      step(
        "Selesai menyampaikan isi. Bagaimana menutup presentasi?",
        [
          c("a", "Terima kasih sudah mendengarkan.", true, "Sempurna! Penutup sopan. Silakan duduk kembali."),
          c("b", "Sudah. Saya duduk.", false, "Tambahkan: Terima kasih sudah mendengarkan."),
          c("c", "Bosen ya kalian?", false, "Lebih baik tutup dengan terima kasih."),
        ],
        "Ucapkan terima kasih.",
      ),
    ],
  },

  // ── Hard · 5 steps · ~220 XP (Real World) ──
  {
    title: "Naik Transportasi Umum",
    scene: "bus",
    role: "Sova di bus",
    difficulty: 4,
    intro: "Level 4 · 5 pertanyaan. Urutan aman: halte → naik → duduk → turun.",
    winMessage: "Sampai di sekolah dengan aman!",
    steps: [
      step(
        "Sova: Kita mau naik bus. Apa yang dilakukan dulu?",
        [
          c("a", "Menunggu di halte dengan tertib.", true, "Benar! Haltelah tempat menunggu bus."),
          c("b", "Berdiri di tengah jalan.", false, "Bahaya. Tunggu di halte."),
          c("c", "Langsung lari ke bus yang bergerak.", false, "Tunggu bus berhenti di halte dulu."),
        ],
        "Tunggu di tempat yang benar.",
      ),
      step("Sova: Bus sudah datang. Apa langkah berikutnya?", [
        c("a", "Naik pelan-pelan dan tanya tujuan ke supir.", true, "Bagus! Naik tertib dan pastikan tujuannya benar."),
        c("b", "Dorong orang lain agar cepat naik.", false, "Antre dan naik pelan-pelan."),
        c("c", "Tidak usah tanya, asal naik.", false, "Penting tanya: Apakah bus ini ke sekolah?"),
      ]),
      step("Supir: Mau ke mana, Nak?", [
        c("a", "Ke sekolah, Pak. Apakah bus ini lewat sekolah?", true, "Tanya tujuan dengan sopan — tepat."),
        c("b", "Mana saja.", false, "Sebut tujuanmu agar tidak salah bus."),
        c("c", "Diam saja naik.", false, "Lebih aman konfirmasi tujuan dulu."),
      ]),
      step("Sova: Di dalam bus, apa yang aman dilakukan?", [
        c("a", "Duduk tenang dan pegang pegangan.", true, "Sempurna. Itulah cara aman di bus."),
        c("b", "Berdiri di pintu dan bersandar.", false, "Lebih aman duduk dan pegang pegangan."),
        c("c", "Berlari di lorong bus.", false, "Jangan berlari. Duduk tenang ya."),
      ]),
      step("Sova: Kita sampai di sekolah. Apa yang dilakukan?", [
        c("a", "Turun pelan-pelan setelah bus berhenti.", true, "Aman! Tunggu bus berhenti dulu."),
        c("b", "Lompat saat bus masih jalan.", false, "Bahaya. Tunggu bus berhenti total."),
        c("c", "Dorong penumpang lain.", false, "Turun antre pelan-pelan."),
      ]),
    ],
  },

  // ── Hardest · 6 steps · ~180–240 XP (Friendship / Celebrate) ──
  {
    title: "Menghadiri Pesta Ulang Tahun",
    scene: "party",
    role: "Teman pesta",
    difficulty: 5,
    intro: "Level 5 · 6 pertanyaan. Ucapkan selamat, main, berbagi, pulang sopan.",
    winMessage: "Pesta seru! Kamu tamu yang sopan.",
    steps: [
      step("Teman: Selamat datang! Apa yang ingin kamu katakan?", [
        c("a", "Selamat ulang tahun!", true, "Ucapan yang pas untuk pesta ulang tahun."),
        c("b", "Mana kuenya?", false, "Ucapkan selamat dulu, baru makan kue."),
        c("c", "Pesta ini biasa saja.", false, "Lebih ramah: Selamat ulang tahun!"),
      ]),
      step("Teman: Terima kasih! Mau ikut main balon?", [
        c("a", "Boleh, terima kasih sudah mengundangku.", true, "Ramah dan sopan. Ayo main!"),
        c("b", "Tidak. Mainanku lebih bagus.", false, "Kalau tidak mau, bilang: Nanti saja, terima kasih."),
        c("c", "Ambil semua balon untuk sendiri.", false, "Berbagi dan main bersama lebih menyenangkan."),
      ]),
      step("Teman: Aku juga bawa mobil-mobilan. Mau tukar main sebentar?", [
        c("a", "Boleh, kita main bergantian.", true, "Berbagi giliran — sikap teman yang baik."),
        c("b", "Mainanku saja, jangan disentuh.", false, "Di pesta, berbagi membuat semua senang."),
        c("c", "Ambil mobilnya diam-diam.", false, "Minta izin dulu sebelum meminjam."),
      ]),
      step("Saatnya tiup lilin. Apa yang kamu lakukan?", [
        c("a", "Ikut menyanyi dan bertepuk tangan.", true, "Sempurna! Meramaikan pesta dengan baik."),
        c("b", "Meniup lilin sebelum yang berulang tahun.", false, "Tunggu yang berulang tahun meniup lilin dulu."),
        c("c", "Pergi tanpa bilang apa-apa.", false, "Ucapkan terima kasih sebelum pulang."),
      ]),
      step("Ada kue. Bagaimana caramu mengambil?", [
        c("a", "Antre dan bilang: Boleh satu potong, terima kasih.", true, "Sopan di meja kue. Hebat!"),
        c("b", "Ambil banyak sekaligus.", false, "Ambil satu dulu, biar adil."),
        c("c", "Dorong teman di depan.", false, "Antre pelan-pelan."),
      ]),
      step("Waktunya pulang. Apa yang kamu ucapkan?", [
        c("a", "Terima kasih, pesta ini menyenangkan. Sampai jumpa!", true, "Penutup sopan — tamu yang hebat."),
        c("b", "Pergi diam-diam.", false, "Ucapkan terima kasih dulu sebelum pulang."),
        c("c", "Pesta jelek.", false, "Lebih baik bilang terima kasih meski lelah."),
      ]),
    ],
  },
];

export function getScenarioGame(title: string): ScenarioGame {
  const found = SCENARIO_GAMES.find((s) => s.title.toLowerCase() === (title || "").toLowerCase());
  return found ?? SCENARIO_GAMES[0];
}

/** @deprecated use getScenarioGame */
export function getScenarioScript(title: string) {
  const g = getScenarioGame(title);
  return {
    title: g.title,
    scene: g.scene,
    role: g.role,
    opening: g.intro,
    defaultChoices: g.steps[0]?.choices.map((c) => c.text) ?? [],
    steps: [],
    fallbackReplies: [],
  };
}

export function sceneKindFor(title: string) {
  return getScenarioGame(title).scene;
}

export function stepCountForScenario(title: string) {
  return getScenarioGame(title).steps.length;
}
