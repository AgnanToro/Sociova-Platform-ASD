/**
 * Sociova demo seed
 * - Adult accounts only (parent / teacher / therapist)
 * - Child is a profile owned by parent (no login)
 * - All passwords hashed with bcrypt (same rounds as register)
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD_ROUNDS = 12;
const DEMO_PASSWORD = "Sociova123!";

const users = {
  child: {
    userId: "00000000-0000-4000-8000-000000000001",
    email: "bimo@sociova.local",
    fullName: "Bimo",
    role: "child",
  },
  parent: {
    userId: "00000000-0000-4000-8000-000000000002",
    email: "budi@sociova.local",
    fullName: "Budi Santoso",
    role: "parent",
  },
  teacher: {
    userId: "00000000-0000-4000-8000-000000000003",
    email: "siti@sociova.local",
    fullName: "Siti Nurhaliza",
    role: "teacher",
  },
  therapist: {
    userId: "00000000-0000-4000-8000-000000000004",
    email: "dr.andini@sociova.local",
    fullName: "Dr. Andini",
    role: "therapist",
  },
  admin: {
    userId: "00000000-0000-4000-8000-000000000005",
    email: "admin@sociova.local",
    fullName: "Admin Sociova",
    role: "admin",
  },
};

const daysAgo = (days, hour = 9) => {
  const value = new Date();
  value.setDate(value.getDate() - days);
  value.setHours(hour, 0, 0, 0);
  return value;
};

async function hashPassword(plain) {
  return bcrypt.hash(plain, PASSWORD_ROUNDS);
}

async function upsertUser(user, passwordHash) {
  await prisma.userProfile.upsert({
    where: { userId: user.userId },
    update: {
      email: user.email,
      fullName: user.fullName,
      passwordHash,
    },
    create: {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.userId, role: user.role } },
    update: {},
    create: { userId: user.userId, role: user.role },
  });

  await prisma.userSettings.upsert({
    where: { userId: user.userId },
    update: {},
    create: { userId: user.userId },
  });
}

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  if (!passwordHash || !passwordHash.startsWith("$2")) {
    throw new Error("Failed to create bcrypt password hash for seed users");
  }

  await Promise.all(Object.values(users).map((user) => upsertUser(user, passwordHash)));

  // Child profile + login account (created by parent in real app)
  let child = await prisma.childProfile.findFirst({
    where: {
      OR: [{ userId: users.child.userId }, { parentId: users.parent.userId, name: "Bimo" }],
    },
  });

  if (child) {
    child = await prisma.childProfile.update({
      where: { id: child.id },
      data: {
        parentId: users.parent.userId,
        userId: users.child.userId,
        teacherId: users.teacher.userId,
        therapistId: users.therapist.userId,
        name: "Bimo",
        age: 8,
        diagnosisLevel: "ASD level 1",
        learningGoal:
          "Berani menyapa teman dan menyampaikan kebutuhan dengan kalimat sederhana.",
      },
    });
  } else {
    child = await prisma.childProfile.create({
      data: {
        parentId: users.parent.userId,
        userId: users.child.userId,
        teacherId: users.teacher.userId,
        therapistId: users.therapist.userId,
        name: "Bimo",
        age: 8,
        diagnosisLevel: "ASD level 1",
        learningGoal:
          "Berani menyapa teman dan menyampaikan kebutuhan dengan kalimat sederhana.",
      },
    });
  }

  // Care team links
  const careTeam = [
    { userId: users.parent.userId, role: "parent" },
    { userId: users.teacher.userId, role: "teacher" },
    { userId: users.therapist.userId, role: "therapist" },
  ];
  for (const member of careTeam) {
    await prisma.careTeamMember.upsert({
      where: {
        childId_userId_role: {
          childId: child.id,
          userId: member.userId,
          role: member.role,
        },
      },
      update: { status: "active", invitedBy: users.parent.userId },
      create: {
        childId: child.id,
        userId: member.userId,
        role: member.role,
        status: "active",
        invitedBy: users.parent.userId,
      },
    });
  }

  const existingProgress = await prisma.learningProgress.findFirst({ where: { childId: child.id } });
  if (existingProgress) {
    await prisma.learningProgress.update({
      where: { id: existingProgress.id },
      data: {
        xp: 1240,
        level: 5,
        streak: 6,
        weeklyGoal: 6,
        completedMissions: 4,
        totalMissions: 6,
        communicationScore: 82,
        confidenceScore: 76,
        empathyScore: 79,
        greetingScore: 88,
        listeningScore: 75,
        conversationScore: 80,
      },
    });
  } else {
    await prisma.learningProgress.create({
      data: {
        childId: child.id,
        xp: 1240,
        level: 5,
        streak: 6,
        weeklyGoal: 6,
        completedMissions: 4,
        totalMissions: 6,
        communicationScore: 82,
        confidenceScore: 76,
        empathyScore: 79,
        greetingScore: 88,
        listeningScore: 75,
        conversationScore: 80,
      },
    });
  }

  const levels = [
    [1, "Mulai Menyapa", "Latihan menyapa orang lain dengan nyaman.", "message-circle", 100],
    [2, "Mengenal Emosi", "Belajar mengenali emosi diri dan teman.", "smile", 125],
    [3, "Bercerita Bergantian", "Melatih percakapan dua arah.", "messages-square", 150],
    [4, "Menjadi Teman", "Berlatih mengajak dan bergabung bermain.", "heart-handshake", 175],
  ];
  for (const [levelOrder, title, description, icon, xpReward] of levels) {
    await prisma.journeyLevel.upsert({
      where: { levelOrder },
      update: { title, description, icon, xpReward },
      create: { levelOrder, title, description, icon, xpReward },
    });
  }
  const journeyLevels = await prisma.journeyLevel.findMany({ orderBy: { levelOrder: "asc" } });
  for (const level of journeyLevels) {
    await prisma.userJourneyProgress.upsert({
      where: { childId_journeyLevelId: { childId: child.id, journeyLevelId: level.id } },
      update: {
        status: level.levelOrder === 1 ? "in_progress" : "locked",
        completedAt: null,
      },
      create: {
        childId: child.id,
        journeyLevelId: level.id,
        status: level.levelOrder === 1 ? "in_progress" : "locked",
        completedAt: null,
      },
    });
  }

  const missions = [
    ["daily", "Sapa satu teman hari ini", "Katakan halo kepada satu teman atau orang dewasa.", 1, 40],
    ["weekly", "Latihan percakapan mingguan", "Selesaikan empat aktivitas komunikasi minggu ini.", 4, 160],
  ];
  for (const [missionType, title, description, targetCount, xpReward] of missions) {
    const current = await prisma.mission.findFirst({ where: { title } });
    if (current) {
      await prisma.mission.update({
        where: { id: current.id },
        data: { missionType, description, targetCount, xpReward, isActive: true },
      });
    } else {
      await prisma.mission.create({
        data: { missionType, title, description, targetCount, xpReward },
      });
    }
  }

  const scenarios = [
    [
      "Perkenalkan Dirimu",
      "Latihan menyebutkan nama dan menyapa dengan ramah.",
      "Halo! 😊 Namaku Sova. Boleh kenalan? Siapa namamu?",
      ["Namaku Bimo.", "Senang bertemu denganmu.", "Siapa namamu?"],
      1,
    ],
    [
      "Pergi ke Dokter Gigi",
      "Latihan menyampaikan rasa takut dan mengikuti instruksi.",
      "Halo, aku dokter gigi. Apa yang kamu rasakan hari ini?",
      ["Saya agak takut.", "Gigi saya sakit.", "Boleh dijelaskan dulu?"],
      2,
    ],
    [
      "Berbicara dengan Guru",
      "Latihan meminta bantuan kepada guru.",
      "Halo Bimo, apa yang ingin kamu tanyakan?",
      ["Bu, boleh saya bertanya?", "Saya belum paham.", "Tolong bantu saya."],
      3,
    ],
    [
      "Bertemu Teman Baru",
      "Latihan menyapa dan mulai bermain bersama teman.",
      "Halo, aku Dika. Boleh aku bermain bersamamu?",
      ["Halo Dika, boleh.", "Aku mau bermain balok.", "Senang bertemu denganmu."],
      4,
    ],
    [
      "Membeli Makanan di Kantin",
      "Latihan meminta makanan dengan sopan.",
      "Halo Bimo, kamu ingin membeli apa hari ini?",
      ["Saya mau roti, Bu.", "Berapa harganya?", "Terima kasih."],
      5,
    ],
    [
      "Presentasi di Depan Kelas",
      "Latihan memperkenalkan ide dengan kalimat pendek dan jelas.",
      "Sekarang giliranmu berbicara di depan kelas. Kamu bisa mulai pelan-pelan.",
      ["Halo teman-teman.", "Saya ingin bercerita.", "Terima kasih sudah mendengarkan."],
      6,
    ],
    [
      "Naik Transportasi Umum",
      "Latihan meminta informasi dan menjaga keamanan di tempat umum.",
      "Halo! Kita akan naik bus bersama. Apa yang perlu kita lakukan dulu?",
      ["Menunggu di halte.", "Bertanya tujuan bus.", "Duduk dengan tenang."],
      7,
    ],
    [
      "Menghadiri Pesta Ulang Tahun",
      "Latihan memberi ucapan dan bermain bersama teman.",
      "Selamat datang di pesta ulang tahun! Apa yang ingin kamu katakan kepada temanmu?",
      ["Selamat ulang tahun!", "Boleh aku ikut bermain?", "Terima kasih sudah mengundangku."],
      8,
    ],
  ];
  for (const [title, description, openingMessage, quickReplies, sortOrder] of scenarios) {
    await prisma.simulationScenario.upsert({
      where: { title },
      update: { description, openingMessage, quickReplies, sortOrder, isActive: true },
      create: { title, description, openingMessage, quickReplies, sortOrder },
    });
  }

  await prisma.activityHistory.deleteMany({ where: { childId: child.id } });
  await prisma.weeklyProgress.deleteMany({ where: { childId: child.id } });
  await prisma.teacherObservation.deleteMany({ where: { childId: child.id } });
  await prisma.therapistNote.deleteMany({ where: { childId: child.id } });
  await prisma.recommendation.deleteMany({ where: { childId: child.id } });
  await prisma.simulationSession.deleteMany({ where: { childId: child.id } });
  await prisma.socialStory.deleteMany({ where: { childId: child.id } });
  await prisma.emotionAnalysis.deleteMany({ where: { childId: child.id } });
  await prisma.achievement.deleteMany({ where: { childId: child.id } });

  await prisma.activityHistory.createMany({
    data: [
      {
        childId: child.id,
        title: "Simulasi: Bertemu Teman Baru",
        category: "AI Simulation",
        detail: "Bimo memilih respons yang sopan saat diajak bermain.",
        score: 88,
        completedAt: daysAgo(0, 15),
      },
      {
        childId: child.id,
        title: "Mengenali Perasaan Gugup",
        category: "Emotion",
        detail: "Bimo dapat menyebutkan bahwa tubuhnya terasa tegang sebelum presentasi.",
        score: 82,
        completedAt: daysAgo(1, 10),
      },
      {
        childId: child.id,
        title: "Cerita Sosial: Menunggu Giliran",
        category: "Social Story",
        detail: "Membaca cerita bersama orang tua.",
        score: 90,
        completedAt: daysAgo(2, 18),
      },
    ],
  });

  await prisma.weeklyProgress.createMany({
    data: [
      {
        childId: child.id,
        weekStart: daysAgo(21),
        communicationScore: 68,
        confidenceScore: 61,
        empathyScore: 66,
        completedActivities: 3,
        summary: "Mulai konsisten menjawab sapaan dengan bantuan visual.",
      },
      {
        childId: child.id,
        weekStart: daysAgo(14),
        communicationScore: 74,
        confidenceScore: 69,
        empathyScore: 72,
        completedActivities: 5,
        summary: "Lebih nyaman memulai percakapan pendek dengan teman dekat.",
      },
      {
        childId: child.id,
        weekStart: daysAgo(7),
        communicationScore: 82,
        confidenceScore: 76,
        empathyScore: 79,
        completedActivities: 4,
        summary: "Mampu meminta bantuan dan bergabung bermain dengan satu arahan.",
      },
    ],
  });

  await prisma.teacherObservation.createMany({
    data: [
      {
        childId: child.id,
        teacherId: users.teacher.userId,
        title: "Diskusi kelompok IPA",
        observation:
          "Bimo menunggu giliran berbicara dan menjawab satu pertanyaan teman dengan suara jelas.",
        supportPlan: "Gunakan kartu giliran bicara pada aktivitas kelompok berikutnya.",
        observedAt: daysAgo(1, 11),
      },
      {
        childId: child.id,
        teacherId: users.teacher.userId,
        title: "Waktu istirahat",
        observation: "Bimo mau bergabung bermain balok setelah diajak oleh satu teman.",
        supportPlan: "Berikan pilihan aktivitas sosial yang terstruktur saat istirahat.",
        observedAt: daysAgo(4, 10),
      },
    ],
  });

  await prisma.therapistNote.createMany({
    data: [
      {
        childId: child.id,
        therapistId: users.therapist.userId,
        title: "Sesi komunikasi sosial",
        note: "Bimo menunjukkan peningkatan saat mengidentifikasi ekspresi wajah senang dan gugup.",
        nextFocus: "Latih strategi menenangkan diri sebelum situasi sosial baru.",
        sessionAt: daysAgo(2, 16),
      },
      {
        childId: child.id,
        therapistId: users.therapist.userId,
        title: "Sesi regulasi emosi",
        note: "Teknik napas empat hitungan membantu Bimo kembali fokus setelah merasa kewalahan.",
        nextFocus: "Praktikkan teknik napas sebelum kegiatan kelas yang ramai.",
        sessionAt: daysAgo(9, 16),
      },
    ],
  });

  await prisma.recommendation.createMany({
    data: [
      {
        childId: child.id,
        authorId: users.therapist.userId,
        audience: "parent",
        title: "Latihan percakapan saat makan malam",
        description:
          "Ajak Bimo memilih satu hal menyenangkan dari harinya dan beri waktu tunggu sebelum membantu menjawab.",
        category: "Home practice",
      },
      {
        childId: child.id,
        authorId: users.therapist.userId,
        audience: "teacher",
        title: "Dukungan visual saat kerja kelompok",
        description:
          "Sediakan kartu urutan: dengarkan, pikirkan, lalu berbicara untuk membantu Bimo mengambil giliran.",
        category: "Classroom support",
      },
      {
        childId: child.id,
        authorId: users.therapist.userId,
        audience: "child",
        title: "Misi hari ini",
        description: "Coba sapa satu teman dengan kalimat: Halo, boleh aku ikut bermain?",
        category: "Daily mission",
      },
    ],
  });

  await prisma.simulationSession.create({
    data: {
      childId: child.id,
      scenario: "Bertemu Teman Baru",
      conversation: [
        { from: "ai", text: "Halo, aku Dika." },
        { from: "me", text: "Halo Dika, senang bertemu denganmu." },
      ],
      score: 88,
      feedback: "Jawabanmu ramah dan jelas.",
      strength: "Berani menyapa lebih dulu.",
      suggestion: "Lanjutkan dengan pertanyaan sederhana tentang permainan.",
      createdAt: daysAgo(0, 15),
    },
  });

  await prisma.socialStory.create({
    data: {
      childId: child.id,
      title: "Menunggu Giliran Bermain",
      situation: "Bimo ingin memakai ayunan, tetapi ada teman yang sedang bermain.",
      generatedStory:
        "Aku bisa menunggu di dekat ayunan. Saat temanku selesai, aku bisa berkata, Boleh aku bermain sekarang? Menunggu membuat semua teman merasa nyaman.",
      createdAt: daysAgo(2, 18),
    },
  });

  await prisma.emotionAnalysis.create({
    data: {
      childId: child.id,
      inputText: "Aku gugup karena besok harus menjawab di depan kelas.",
      detectedEmotion: "Gugup",
      confidence: 91.5,
      recommendation:
        "Tarik napas pelan empat kali dan siapkan satu kalimat pembuka bersama orang tua.",
      createdAt: daysAgo(1, 10),
    },
  });

  await prisma.achievement.createMany({
    data: [
      {
        childId: child.id,
        name: "First Hello",
        description: "Berhasil menyelesaikan latihan menyapa pertama.",
        unlockedAt: daysAgo(12),
      },
      {
        childId: child.id,
        name: "7-Day Streak",
        description: "Berlatih selama 7 hari berturut-turut.",
        unlockedAt: daysAgo(4),
      },
      {
        childId: child.id,
        name: "Emotion Explorer",
        description: "Berhasil mengenali 10 jenis emosi.",
        unlockedAt: daysAgo(3),
      },
    ],
  });

  const resources = [
    [
      "Memahami Sensitivitas Sensorik pada Anak ASD",
      "Panduan praktis untuk memahami kebutuhan sensorik anak.",
      "Guide",
    ],
    [
      "Cara Melatih Percakapan yang Tenang",
      "Animasi Sova: latihan komunikasi singkat bersama anak.",
      "Video",
    ],
    [
      "Kartu Kosakata Emosi",
      "Lembar aktivitas untuk mengenali dan menyebutkan perasaan.",
      "Worksheet",
    ],
    [
      "Panduan Social Story untuk Rutinitas Baru",
      "Langkah sederhana membantu anak memahami situasi baru dengan cerita yang menenangkan.",
      "Guide",
    ],
    [
      "Latihan Napas 4-4-4 bersama Anak",
      "Animasi Sova: regulasi emosi singkat sebelum sekolah atau kegiatan sosial.",
      "Exercise",
    ],
    [
      "Checklist Komunikasi Rumah dan Sekolah",
      "Daftar observasi ringkas untuk orang tua dan guru saat memantau perkembangan sosial.",
      "Checklist",
    ],
  ];
  for (const [title, description, category] of resources) {
    const current = await prisma.resource.findFirst({ where: { title } });
    if (current) {
      await prisma.resource.update({
        where: { id: current.id },
        data: { description, category, url: null, isActive: true },
      });
    } else {
      await prisma.resource.create({ data: { title, description, category } });
    }
  }

  await prisma.communityPost.deleteMany({
    where: { authorId: { in: Object.values(users).map((user) => user.userId) } },
  });
  await prisma.communityPost.createMany({
    data: [
      {
        authorId: users.parent.userId,
        role: "parent",
        content:
          "Latihan menyapa sebelum berangkat sekolah cukup membantu Bimo lebih percaya diri.",
      },
      {
        authorId: users.teacher.userId,
        role: "teacher",
        content: "Kartu giliran bicara membuat diskusi kelompok lebih nyaman untuk siswa kami.",
      },
      {
        authorId: users.therapist.userId,
        role: "therapist",
        content:
          "Konsistensi latihan kecil di rumah dan sekolah lebih penting daripada sesi yang panjang.",
      },
    ],
  });

  console.log("Sociova demo seed selesai.");
  console.log("  child      → bimo@sociova.local  (akun anak, fitur belajar)");
  console.log("  parent     → budi@sociova.local  (monitor + kelola akun anak)");
  console.log("  teacher    → siti@sociova.local");
  console.log("  therapist  → dr.andini@sociova.local");
  console.log("  admin      → admin@sociova.local (kelola sistem)");
  console.log(`Password (bcrypt hashed in DB): ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
