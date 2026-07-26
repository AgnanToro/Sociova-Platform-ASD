export const demoProfile = {
  full_name: "Amina Zayd",
  email: "amina@sociova.demo",
};

export const demoChild = {
  id: "demo-child",
  name: "Bimo",
  age: 8,
  diagnosis_level: "ASD support profile",
  learning_goal: "Melatih komunikasi sosial, mengenali emosi, dan membangun percaya diri.",
};

export const demoProgress = {
  xp: 2480,
  level: 7,
  streak: 12,
  weekly_goal: 6,
  completed_missions: 4,
  total_missions: 6,
  communication_score: 86,
  confidence_score: 78,
  empathy_score: 72,
  greeting_score: 92,
  listening_score: 74,
  conversation_score: 81,
};

export const demoMissions = {
  daily: {
    title: "Berkenalan dengan Teman Baru",
    description:
      "Mulailah percakapan dengan menyapa teman, memperkenalkan diri, lalu tanyakan nama temanmu.",
    target_count: 4,
  },
  weekly: {
    title: "Selesaikan 6 simulasi sosial",
    description:
      "Latih enam situasi sosial bersama Sova untuk membangun rasa percaya diri secara bertahap.",
    target_count: 6,
  },
};

export const demoJourneyLevels = [
  {
    level_order: 1,
    title: "Greeting",
    description: "Belajar menyapa dengan sopan dan memperkenalkan diri.",
    icon: "message-circle",
    status: "completed",
  },
  {
    level_order: 2,
    title: "Emotion",
    description: "Kenali emosimu sendiri dan pahami perasaan orang lain.",
    icon: "smile",
    status: "completed",
  },
  {
    level_order: 3,
    title: "Conversation",
    description: "Belajar berbicara bergantian dan menjaga alur percakapan.",
    icon: "bot",
    status: "in_progress",
  },
  {
    level_order: 4,
    title: "School",
    description: "Berlatih berinteraksi dengan guru dan teman di sekolah.",
    icon: "school",
    status: "locked",
  },
  {
    level_order: 5,
    title: "Friendship",
    description: "Membangun dan menjaga pertemanan yang baik.",
    icon: "heart-handshake",
    status: "locked",
  },
  {
    level_order: 6,
    title: "Presentation",
    description: "Berlatih berbicara percaya diri di depan orang lain.",
    icon: "presentation",
    status: "locked",
  },
  {
    level_order: 7,
    title: "Real World",
    description: "Menghadapi situasi sehari-hari seperti berbelanja dan naik transportasi umum.",
    icon: "bus",
    status: "locked",
  },
  {
    level_order: 8,
    title: "Celebrate",
    description: "Berlatih bersosialisasi saat ulang tahun atau acara bersama.",
    icon: "party-popper",
    status: "locked",
  },
];

export const demoScenarios = [
  {
    title: "Perkenalkan Dirimu",
    description: "Latihan menyebutkan nama dan menyapa dengan ramah.",
    opening_message: "Halo! 😊 Namaku Sova. Boleh kenalan? Siapa namamu?",
    quick_replies: ["Namaku Bimo.", "Senang bertemu denganmu.", "Siapa namamu?"],
  },
  {
    title: "Pergi ke Dokter Gigi",
    description: "Latihan menyampaikan rasa takut dan mengikuti instruksi.",
    opening_message: "Halo, aku dokter gigi. Apa yang kamu rasakan hari ini?",
    quick_replies: ["Saya agak takut.", "Gigi saya sakit.", "Boleh dijelaskan dulu?"],
  },
  {
    title: "Berbicara dengan Guru",
    description: "Latihan bertanya kepada guru ketika membutuhkan bantuan.",
    opening_message: "Halo Bimo, kelihatannya kamu ingin bertanya. Apa yang ingin kamu sampaikan?",
    quick_replies: ["Bu, boleh saya bertanya?", "Saya belum paham.", "Tolong bantu saya."],
  },
  {
    title: "Bertemu Teman Baru",
    description: "Latihan memulai percakapan dengan teman baru.",
    opening_message:
      "Halo! Aku Sova 😊 Hari ini kita belajar berkenalan dengan teman baru. Siapa namamu?",
    quick_replies: ["Namaku Bimo.", "Senang bertemu denganmu.", "Apa hobimu?"],
  },
  {
    title: "Membeli Makanan di Kantin",
    description: "Latihan meminta bantuan dan memesan makanan dengan sopan.",
    opening_message: "Halo, aku penjaga kantin. Kamu ingin membeli apa hari ini?",
    quick_replies: ["Saya mau roti, Bu.", "Berapa harganya?", "Terima kasih."],
  },
  {
    title: "Presentasi di Depan Kelas",
    description: "Latihan memperkenalkan ide dengan kalimat pendek dan jelas.",
    opening_message: "Sekarang giliranmu berbicara di depan kelas. Kamu bisa mulai pelan-pelan.",
    quick_replies: [
      "Halo teman-teman.",
      "Saya ingin bercerita.",
      "Terima kasih sudah mendengarkan.",
    ],
  },
  {
    title: "Naik Transportasi Umum",
    description: "Latihan meminta informasi dan menjaga keamanan di tempat umum.",
    opening_message: "Halo! Kita akan naik bus bersama. Apa yang perlu kita lakukan dulu?",
    quick_replies: ["Menunggu di halte.", "Bertanya tujuan bus.", "Duduk dengan tenang."],
  },
  {
    title: "Menghadiri Pesta Ulang Tahun",
    description: "Latihan memberi ucapan dan bermain bersama teman.",
    opening_message:
      "Selamat datang di pesta ulang tahun! Apa yang ingin kamu katakan kepada temanmu?",
    quick_replies: [
      "Selamat ulang tahun!",
      "Boleh aku ikut bermain?",
      "Terima kasih sudah mengundangku.",
    ],
  },
];

export const demoAchievements = [
  {
    name: "First Hello",
    description: "Berhasil menyelesaikan latihan menyapa pertama.",
    earned: true,
  },
  { name: "7-Day Streak", description: "Berlatih selama 7 hari berturut-turut.", earned: true },
  { name: "Emotion Explorer", description: "Berhasil mengenali 10 jenis emosi.", earned: true },
  {
    name: "Confident Speaker",
    description: "Berhasil menyelesaikan latihan presentasi.",
    earned: false,
  },
  {
    name: "Friendship Builder",
    description: "Berhasil menyelesaikan 5 skenario pertemanan.",
    earned: false,
  },
  { name: "Fast Learner", description: "Menyelesaikan 3 misi dalam satu hari.", earned: false },
];

export const demoResources = [
  {
    category: "Guide",
    title: "Memahami Sensitivitas Sensorik pada Anak ASD",
    description: "Panduan praktis untuk memahami kebutuhan sensorik anak.",
    time: "6 min read",
  },
  {
    category: "Video",
    title: "Cara Melatih Percakapan yang Tenang",
    description: "Contoh latihan komunikasi singkat bersama anak.",
    time: "4 min",
  },
  {
    category: "Worksheet",
    title: "Kartu Kosakata Emosi",
    description: "Kartu bantu untuk mengenali dan menyebutkan perasaan.",
    time: "PDF · 12 pages",
  },
  {
    category: "Guide",
    title: "Membangun Kebiasaan Berteman yang Positif",
    description: "Rutinitas kecil untuk mendukung interaksi sosial.",
    time: "8 min read",
  },
  {
    category: "Video",
    title: "Mempersiapkan Anak Menghadapi Sekolah Baru",
    description: "Langkah tenang sebelum rutinitas baru dimulai.",
    time: "6 min",
  },
  {
    category: "Worksheet",
    title: "Lembar Refleksi Perkembangan Mingguan",
    description: "Refleksi sederhana untuk keluarga dan pendamping.",
    time: "PDF · 4 pages",
  },
];

export const demoCommunityPosts = [
  {
    author: "Bu Rina",
    role: "Parent",
    time: "2 jam lalu",
    content:
      "Hari ini anak saya berhasil memperkenalkan diri kepada teman barunya setelah latihan di Sociova. Senang sekali melihat perkembangannya. 💙",
    likes: 24,
    comments: 6,
  },
  {
    author: "Pak Andi",
    role: "Teacher",
    time: "5 jam lalu",
    content:
      "Hari ini salah satu siswa mulai berani mengatakan 'Saya sedang cemas' daripada langsung diam. Perkembangan kecil seperti ini sangat berarti.",
    likes: 58,
    comments: 12,
  },
  {
    author: "Dr. Maya",
    role: "Therapist",
    time: "1 hari lalu",
    content:
      "Tips hari ini: gunakan Social Story sebelum anak menghadapi situasi baru agar anak lebih siap dan tidak mudah cemas.",
    likes: 41,
    comments: 9,
  },
];

export const demoStories = [
  { title: "Pergi ke Dokter Gigi", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  {
    title: "Berkunjung ke Rumah Nenek",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  { title: "Presentasi di Kelas", created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
];

export const demoEmotionLogs = [
  {
    detected_emotion: "Cemas",
    confidence: 84,
    created_at: new Date().toISOString(),
    input_text: "Aku tidak mau pergi ke sekolah besok. Perutku terasa aneh.",
  },
  {
    detected_emotion: "Tenang",
    confidence: 72,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    input_text: "Hari ini aku senang bermain bersama teman.",
  },
];

export const demoSimulationSessions = [
  { scenario: "Bertemu Teman Baru", score: 86, created_at: new Date().toISOString() },
  {
    scenario: "Perkenalkan Dirimu",
    score: 82,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];
