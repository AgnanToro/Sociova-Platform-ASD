import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import {
  analyzeEmotion,
  buildWeeklyBars,
  generateSocialStory,
  scoreSimulation,
} from "@/lib/sociova-ai";
import { buildWeeklyReportHtml, normalizeReportPayload } from "@/lib/weekly-report";

const demoChild = {
  id: "demo-child",
  name: "Bimo",
  age: 8,
  diagnosis_level: "ASD Level 1",
  learning_goal: "Berani menyapa teman dan menyampaikan kebutuhan dengan kalimat sederhana.",
};

const toSnake = (value: any): any => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toSnake);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      toSnake(item),
    ]),
  );
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "development-only-secret-change-me");

function relativeTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(date);
}

function roleLabel(role?: string | null) {
  return (
    {
      child: "Anak",
      parent: "Orang Tua",
      teacher: "Guru",
      therapist: "Terapis",
    } as Record<string, string>
  )[role ?? ""] ?? "Anggota";
}

function mapSettings(input: Record<string, any> = {}) {
  return {
    dailyMissionReminder: Boolean(input.daily_mission_reminder ?? input.dailyMissionReminder),
    weeklyProgressReport: Boolean(input.weekly_progress_report ?? input.weeklyProgressReport),
    communityReplies: Boolean(input.community_replies ?? input.communityReplies),
    largeFont: Boolean(input.large_font ?? input.largeFont),
    highContrast: Boolean(input.high_contrast ?? input.highContrast),
    reduceMotion: Boolean(input.reduce_motion ?? input.reduceMotion),
    screenReader: Boolean(input.screen_reader ?? input.screenReader),
    allowResearchData: Boolean(input.allow_research_data ?? input.allowResearchData),
    shareWithTherapist: Boolean(input.share_with_therapist ?? input.shareWithTherapist),
  };
}

async function currentUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: String(payload.userId),
      role: String(payload.role),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

async function childFor(user: { userId: string; role: string }, childId?: string | null) {
  const where =
    user.role === "child"
      ? { userId: user.userId }
      : user.role === "parent"
        ? { parentId: user.userId }
        : user.role === "teacher"
          ? { teacherId: user.userId }
          : { therapistId: user.userId };
  if (childId && user.role !== "child") {
    return prisma.childProfile.findFirst({ where: { ...where, id: childId } });
  }
  return prisma.childProfile.findFirst({ where, orderBy: { createdAt: "asc" } });
}

async function childrenFor(user: { userId: string; role: string }) {
  if (user.role === "child") {
    const child = await childFor(user);
    return child ? [child] : [];
  }
  const field = user.role === "parent" ? "parentId" : user.role === "teacher" ? "teacherId" : "therapistId";
  return prisma.childProfile.findMany({
    where: { [field]: user.userId },
    orderBy: { name: "asc" },
  });
}

async function roleDashboard(user: { userId: string; role: string }) {
  const field =
    user.role === "parent" ? "parentId" : user.role === "teacher" ? "teacherId" : "therapistId";
  const children = await prisma.childProfile.findMany({
    where: { [field]: user.userId },
    orderBy: { name: "asc" },
  });
  const progress = await prisma.learningProgress.findMany({
    where: { childId: { in: children.map((child) => child.id) } },
  });
  return {
    demoMode: false,
    children: toSnake(children),
    progressByChild: Object.fromEntries(progress.map((item) => [item.childId, toSnake(item)])),
  };
}

async function authorMap(authorIds: string[]) {
  const profiles = await prisma.userProfile.findMany({
    where: { userId: { in: authorIds } },
    select: { userId: true, fullName: true },
  });
  return new Map(profiles.map((profile) => [profile.userId, profile.fullName || "Anggota Sociova"]));
}

async function loadCommunity(userId: string) {
  const posts = await prisma.communityPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      replies: { orderBy: { createdAt: "asc" }, take: 8 },
      likesRel: { where: { userId }, select: { id: true } },
    },
  });
  const authorIds = Array.from(
    new Set([
      ...posts.map((post) => post.authorId),
      ...posts.flatMap((post) => post.replies.map((reply) => reply.authorId)),
    ]),
  );
  const authors = await authorMap(authorIds);
  return {
    demoMode: false,
    posts: posts.map((post) => ({
      id: post.id,
      role: post.role,
      content: post.content,
      likes: post.likes,
      comments: post.comments,
      liked_by_me: post.likesRel.length > 0,
      created_at: post.createdAt.toISOString(),
      time: relativeTime(post.createdAt),
      author: authors.get(post.authorId) ?? roleLabel(post.role),
      replies: post.replies.map((reply) => ({
        id: reply.id,
        role: reply.role,
        content: reply.content,
        created_at: reply.createdAt.toISOString(),
        time: relativeTime(reply.createdAt),
        author: authors.get(reply.authorId) ?? roleLabel(reply.role),
      })),
    })),
  };
}

async function analyticsFor(user: { userId: string; role: string }) {
  const child = await childFor(user);
  if (!child) {
    return {
      demoMode: true,
      child: demoChild,
      radar: [],
      weekly: [],
      monthly: [],
      emotionTrends: [],
      progress: null,
    };
  }
  const [progress, activities, emotions, weekly, sessions] = await Promise.all([
    prisma.learningProgress.findFirst({ where: { childId: child.id } }),
    prisma.activityHistory.findMany({
      where: { childId: child.id },
      orderBy: { completedAt: "desc" },
      take: 60,
    }),
    prisma.emotionAnalysis.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.weeklyProgress.findMany({
      where: { childId: child.id },
      orderBy: { weekStart: "asc" },
    }),
    prisma.simulationSession.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: "asc" },
      take: 12,
    }),
  ]);

  const radar = [
    { skill: "Communication", value: progress?.communicationScore ?? 0 },
    { skill: "Confidence", value: progress?.confidenceScore ?? 0 },
    { skill: "Empathy", value: progress?.empathyScore ?? 0 },
    { skill: "Greeting", value: progress?.greetingScore ?? 0 },
    { skill: "Listening", value: progress?.listeningScore ?? 0 },
    { skill: "Conversation", value: progress?.conversationScore ?? 0 },
  ];

  const weeklyBars = buildWeeklyBars(
    activities.map((item) => ({ completedAt: item.completedAt, score: item.score })),
  );

  const monthly =
    weekly.length > 0
      ? weekly.map((item) => ({
          m: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(item.weekStart),
          score: Math.round(
            (item.communicationScore + item.confidenceScore + item.empathyScore) / 3,
          ),
        }))
      : sessions.map((item) => ({
          m: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
            item.createdAt,
          ),
          score: item.score ?? 0,
        }));

  const emotionCounts = new Map<string, number>();
  for (const item of emotions) {
    const key = item.detectedEmotion || "Lainnya";
    emotionCounts.set(key, (emotionCounts.get(key) ?? 0) + 1);
  }

  return {
    demoMode: false,
    child: toSnake(child),
    progress: toSnake(progress),
    radar,
    weekly: weeklyBars,
    monthly,
    emotionTrends: Array.from(emotionCounts.entries()).map(([label, count]) => ({
      label,
      count,
    })),
    recentEmotions: toSnake(emotions.slice(0, 8)),
    weeklyReports: toSnake(weekly),
  };
}

async function getData(action: string, user: { userId: string; role: string }, childId?: string | null) {
  if (action === "dashboard") {
    const child = await childFor(user);
    if (!child) {
      return {
        demoMode: true,
        profile: { full_name: user.email.split("@")[0] },
        child: demoChild,
        progress: {
          xp: 1240,
          level: 5,
          streak: 6,
          completed_missions: 4,
          total_missions: 6,
          weekly_goal: 6,
        },
        dailyMission: null,
        weeklyMission: null,
        recentSessions: [],
        recentStories: [],
        latestEmotion: null,
        weeklyBars: buildWeeklyBars([]),
        missionProgress: { done: 4, total: 6, value: 67 },
      };
    }
    const [profile, progress, missions, sessions, stories, emotion, activity, recommendations] =
      await Promise.all([
        prisma.userProfile.findUnique({ where: { userId: user.userId } }),
        prisma.learningProgress.findFirst({ where: { childId: child.id } }),
        prisma.mission.findMany({ where: { isActive: true } }),
        prisma.simulationSession.findMany({
          where: { childId: child.id },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.socialStory.findMany({
          where: { childId: child.id },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.emotionAnalysis.findFirst({
          where: { childId: child.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.activityHistory.findMany({
          where: { childId: child.id },
          orderBy: { completedAt: "desc" },
          take: 14,
        }),
        prisma.recommendation.findMany({
          where: { childId: child.id, audience: user.role as any },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
      ]);
    const dailyMission = missions.find((mission) => mission.missionType === "daily") ?? null;
    const weeklyMission = missions.find((mission) => mission.missionType === "weekly") ?? null;
    return {
      demoMode: false,
      profile: toSnake(profile),
      child: toSnake(child),
      progress: toSnake(progress),
      dailyMission: toSnake(dailyMission),
      weeklyMission: toSnake(weeklyMission),
      recentSessions: toSnake(sessions),
      recentStories: toSnake(stories),
      latestEmotion: toSnake(emotion),
      recentActivity: toSnake(activity),
      recommendations: toSnake(recommendations),
      weeklyBars: buildWeeklyBars(
        activity.map((item) => ({ completedAt: item.completedAt, score: item.score })),
      ),
      missionProgress: {
        done: progress?.completedMissions ?? 0,
        total: progress?.totalMissions || dailyMission?.targetCount || 1,
        value: Math.round(
          ((progress?.completedMissions ?? 0) /
            (progress?.totalMissions || dailyMission?.targetCount || 1)) *
            100,
        ),
      },
    };
  }

  if (action === "journey") {
    const child = await childFor(user);
    const levels = await prisma.journeyLevel.findMany({ orderBy: { levelOrder: "asc" } });
    const rows = child
      ? await prisma.userJourneyProgress.findMany({ where: { childId: child.id } })
      : [];
    const statuses = new Map(rows.map((row) => [row.journeyLevelId, row.status]));
    return {
      demoMode: !child,
      levels: toSnake(
        levels.map((level) => ({
          ...level,
          status: statuses.get(level.id) ?? "locked",
        })),
      ),
    };
  }

  if (action === "simulation") {
    return toSnake(
      await prisma.simulationScenario.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    );
  }

  if (action === "story" || action === "emotion" || action === "achievements") {
    const child = await childFor(user);
    if (!child) {
      return action === "achievements"
        ? { demoMode: true, progress: null, achievements: [] }
        : { demoMode: true, [action === "story" ? "stories" : "logs"]: [] };
    }
    if (action === "story") {
      return {
        demoMode: false,
        stories: toSnake(
          await prisma.socialStory.findMany({
            where: { childId: child.id },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
        ),
      };
    }
    if (action === "emotion") {
      return {
        demoMode: false,
        logs: toSnake(
          await prisma.emotionAnalysis.findMany({
            where: { childId: child.id },
            orderBy: { createdAt: "desc" },
            take: 8,
          }),
        ),
      };
    }
    const [progress, earned] = await Promise.all([
      prisma.learningProgress.findFirst({ where: { childId: child.id } }),
      prisma.achievement.findMany({ where: { childId: child.id } }),
    ]);
    return {
      demoMode: false,
      progress: toSnake(progress),
      achievements: toSnake(earned.map((badge) => ({ ...badge, earned: true }))),
    };
  }

  if (action === "community") return loadCommunity(user.userId);
  if (action === "analytics") return analyticsFor(user);

  if (action === "resources") {
    const resources = await prisma.resource.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return toSnake(
      resources.map((item) => ({
        ...item,
        time: item.category === "Worksheet" ? "PDF" : "5 min read",
        can_open: Boolean(item.url),
      })),
    );
  }

  if (action === "notifications") {
    const settings = await prisma.userSettings.findUnique({ where: { userId: user.userId } });
    const child = await childFor(user);
    const items: Array<{ id: string; title: string; body: string; time: string; type: string }> = [];
    if (settings?.dailyMissionReminder !== false) {
      items.push({
        id: "mission",
        title: "Daily mission reminder",
        body: "Selesaikan misi harian hari ini agar streak tetap berjalan.",
        time: "Hari ini",
        type: "mission",
      });
    }
    if (settings?.weeklyProgressReport !== false) {
      items.push({
        id: "weekly",
        title: "Weekly progress report",
        body: "Laporan mingguan siap dibuka di menu Weekly Report / Analytics.",
        time: "Minggu ini",
        type: "report",
      });
    }
    if (settings?.communityReplies) {
      items.push({
        id: "community",
        title: "Community replies",
        body: "Notifikasi balasan komunitas aktif. Cek menu Community untuk percakapan terbaru.",
        time: "Baru",
        type: "community",
      });
    }
    if (child) {
      const [latestObservation, latestNote, latestActivity] = await Promise.all([
        prisma.teacherObservation.findFirst({ where: { childId: child.id }, orderBy: { observedAt: "desc" } }),
        prisma.therapistNote.findFirst({ where: { childId: child.id }, orderBy: { sessionAt: "desc" } }),
        prisma.activityHistory.findFirst({ where: { childId: child.id }, orderBy: { completedAt: "desc" } }),
      ]);
      if (latestObservation) {
        items.push({
          id: `obs-${latestObservation.id}`,
          title: "Observasi guru terbaru",
          body: latestObservation.title,
          time: relativeTime(latestObservation.observedAt),
          type: "observation",
        });
      }
      if (latestNote) {
        items.push({
          id: `note-${latestNote.id}`,
          title: "Catatan terapis terbaru",
          body: latestNote.title,
          time: relativeTime(latestNote.sessionAt),
          type: "session",
        });
      }
      if (latestActivity) {
        items.push({
          id: `act-${latestActivity.id}`,
          title: "Aktivitas terbaru",
          body: latestActivity.title,
          time: relativeTime(latestActivity.completedAt),
          type: "activity",
        });
      }
    }
    return {
      settings: toSnake(settings),
      items,
      unread: items.length,
    };
  }

  if (action === "settings") {
    const [profile, settings] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: user.userId } }),
      prisma.userSettings.findUnique({ where: { userId: user.userId } }),
    ]);
    return toSnake({ profile, settings, role: user.role });
  }

  if (action === "role") return roleDashboard(user);

  if (action === "role-detail" || action === "report") {
    const child = await childFor(user, action === "report" ? childId : null);
    if (!child) return {};
    const [profile, progress, weekly, observations, notes, recommendations, activities] =
      await Promise.all([
        prisma.userProfile.findUnique({ where: { userId: user.userId } }),
        prisma.learningProgress.findFirst({ where: { childId: child.id } }),
        prisma.weeklyProgress.findMany({
          where: { childId: child.id },
          orderBy: { weekStart: "asc" },
        }),
        prisma.teacherObservation.findMany({
          where: { childId: child.id },
          orderBy: { observedAt: "desc" },
        }),
        prisma.therapistNote.findMany({
          where: { childId: child.id },
          orderBy: { sessionAt: "desc" },
        }),
        prisma.recommendation.findMany({
          where: { childId: child.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.activityHistory.findMany({
          where: { childId: child.id },
          orderBy: { completedAt: "desc" },
        }),
      ]);

    if (action === "report") {
      const generatedAt = new Date().toISOString();
      const base = {
        childName: child.name,
        role: user.role,
        generatedBy: profile?.fullName || user.email,
        generatedAt,
        progress,
        weekly,
        activities,
        observations,
        notes,
        recommendations,
      };
      const html = buildWeeklyReportHtml(base);
      const normalized = normalizeReportPayload(base);
      return {
        html,
        child: toSnake(child),
        children: toSnake(await childrenFor(user)),
        generated_by: base.generatedBy,
        generated_at: generatedAt,
        role: user.role,
        progress: toSnake(progress),
        weekly: toSnake(weekly),
        activities: toSnake(activities),
        observations: toSnake(observations),
        notes: toSnake(notes),
        recommendations: toSnake(recommendations),
        summary: normalized.progress,
      };
    }

    return toSnake({
      child,
      progress,
      weekly,
      observations,
      notes,
      recommendations,
      activities,
    });
  }

  throw new Error("Unknown data action");
}

export const Route = createFileRoute("/api/data/$action")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const user = await currentUser(request);
          if (!user) return json({ error: "Unauthorized" }, 401);
          const childId = new URL(request.url).searchParams.get("child_id");
          return json(await getData(params.action, user, childId));
        } catch (error) {
          console.error("[api/data GET]", params.action, error);
          return json({ error: "Server error" }, 500);
        }
      },
      POST: async ({ request, params }) => {
        try {
          const user = await currentUser(request);
          if (!user) return json({ error: "Unauthorized" }, 401);
          const body = await request.json();
          const action = params.action;

          if (action === "settings") {
            const settings = mapSettings(body.settings ?? {});
            await prisma.$transaction([
              prisma.userProfile.update({
                where: { userId: user.userId },
                data: {
                  fullName: body.full_name ?? body.fullName,
                  languageMode: body.language_mode ?? body.languageMode ?? "hybrid",
                },
              }),
              prisma.userSettings.upsert({
                where: { userId: user.userId },
                update: settings,
                create: { userId: user.userId, ...settings },
              }),
            ]);
            return json({ saved: true });
          }

          if (action === "community") {
            await prisma.communityPost.create({
              data: {
                authorId: user.userId,
                role: user.role as any,
                content: String(body.content ?? "").trim(),
              },
            });
            return json({ saved: true });
          }

          if (action === "community-reply") {
            const postId = String(body.post_id ?? body.postId ?? "");
            const content = String(body.content ?? "").trim();
            if (!postId || !content) return json({ error: "Balasan tidak valid" }, 400);
            await prisma.$transaction([
              prisma.communityReply.create({
                data: {
                  postId,
                  authorId: user.userId,
                  role: user.role as any,
                  content,
                },
              }),
              prisma.communityPost.update({
                where: { id: postId },
                data: { comments: { increment: 1 } },
              }),
            ]);
            return json({ saved: true });
          }

          if (action === "community-like") {
            const postId = String(body.post_id ?? body.postId ?? "");
            if (!postId) return json({ error: "Post tidak valid" }, 400);
            const existing = await prisma.communityLike.findUnique({
              where: { postId_userId: { postId, userId: user.userId } },
            });
            if (existing) {
              return json({ saved: true, already_liked: true });
            }
            await prisma.$transaction([
              prisma.communityLike.create({
                data: { postId, userId: user.userId },
              }),
              prisma.communityPost.update({
                where: { id: postId },
                data: { likes: { increment: 1 } },
              }),
            ]);
            return json({ saved: true, already_liked: false });
          }

          if (action === "resource") {
            if (!["parent", "teacher", "therapist"].includes(user.role)) {
              return json({ error: "Hanya parent/guru/terapis yang bisa menambah resource" }, 403);
            }
            const title = String(body.title ?? "").trim();
            const description = String(body.description ?? "").trim();
            const category = String(body.category ?? "Guide").trim() || "Guide";
            const url = String(body.url ?? "").trim() || null;
            if (!title || !description) return json({ error: "Judul dan deskripsi wajib diisi" }, 400);
            const created = await prisma.resource.create({
              data: {
                title,
                description,
                category,
                url,
                language: String(body.language ?? "id"),
                createdBy: user.userId,
              },
            });
            return json({ saved: true, resource: toSnake(created) });
          }

          if (action === "analyze-emotion") {
            return json(analyzeEmotion(String(body.input_text ?? body.text ?? "")));
          }

          if (action === "simulate-turn") {
            return json(
              scoreSimulation({
                scenario: String(body.scenario ?? ""),
                conversation: body.conversation ?? [],
              }),
            );
          }

          if (action === "generate-story") {
            return json(generateSocialStory(String(body.situation ?? "")));
          }

          const child = await childFor(user);
          if (!child) return json({ saved: false, error: "Profil anak belum terhubung" }, 404);

          if (action === "simulation") {
            const scored = scoreSimulation({
              scenario: body.scenario,
              conversation: body.conversation ?? [],
            });
            await prisma.simulationSession.create({
              data: {
                childId: child.id,
                scenario: body.scenario,
                conversation: body.conversation,
                score: body.score ?? scored.score,
                feedback: body.feedback ?? scored.feedback,
                strength: body.strength ?? scored.strength,
                suggestion: body.suggestion ?? scored.suggestion,
              },
            });
            await prisma.activityHistory.create({
              data: {
                childId: child.id,
                title: `Simulasi: ${body.scenario}`,
                category: "AI Simulation",
                score: body.score ?? scored.score,
                detail: body.feedback ?? scored.feedback,
              },
            });
            const progress = await prisma.learningProgress.findFirst({
              where: { childId: child.id },
            });
            if (progress) {
              await prisma.learningProgress.update({
                where: { id: progress.id },
                data: {
                  xp: progress.xp + 80,
                  completedMissions: Math.min(
                    progress.completedMissions + 1,
                    progress.totalMissions || 6,
                  ),
                  communicationScore: Math.max(
                    progress.communicationScore,
                    body.score ?? scored.score,
                  ),
                  conversationScore: Math.max(
                    progress.conversationScore,
                    body.score ?? scored.score,
                  ),
                },
              });
            }
            return json({ saved: true, ...scored });
          }

          if (action === "story") {
            const generated =
              body.generatedStory ||
              generateSocialStory(String(body.situation ?? "")).generatedStory;
            const title =
              body.title ||
              (body.situation?.length > 42
                ? `${body.situation.slice(0, 42)}...`
                : body.situation);
            await prisma.socialStory.create({
              data: {
                childId: child.id,
                title,
                situation: body.situation,
                generatedStory: generated,
              },
            });
            await prisma.activityHistory.create({
              data: {
                childId: child.id,
                title: `Cerita Sosial: ${title}`,
                category: "Social Story",
                detail: body.situation,
                score: 88,
              },
            });
            return json({ saved: true, generatedStory: generated, title });
          }

          if (action === "emotion") {
            const analyzed =
              body.detected_emotion && body.recommendation
                ? {
                    label: body.detected_emotion,
                    confidence: body.confidence,
                    rec: body.recommendation,
                  }
                : analyzeEmotion(String(body.input_text ?? ""));
            await prisma.emotionAnalysis.create({
              data: {
                childId: child.id,
                inputText: body.input_text,
                detectedEmotion: analyzed.label,
                confidence: analyzed.confidence,
                recommendation: analyzed.rec,
              },
            });
            await prisma.activityHistory.create({
              data: {
                childId: child.id,
                title: `Mengenali Perasaan ${analyzed.label}`,
                category: "Emotion",
                detail: body.input_text,
                score: analyzed.confidence,
              },
            });
            return json({ saved: true, ...analyzed });
          }

          if (action === "observation") {
            if (user.role !== "teacher") return json({ error: "Hanya guru" }, 403);
            await prisma.teacherObservation.create({
              data: {
                childId: child.id,
                teacherId: user.userId,
                title: String(body.title ?? "Observasi kelas"),
                observation: String(body.observation ?? ""),
                supportPlan: body.support_plan ?? body.supportPlan ?? null,
              },
            });
            return json({ saved: true });
          }

          if (action === "session-note") {
            if (user.role !== "therapist") return json({ error: "Hanya terapis" }, 403);
            await prisma.therapistNote.create({
              data: {
                childId: child.id,
                therapistId: user.userId,
                title: String(body.title ?? "Catatan sesi"),
                note: String(body.note ?? ""),
                nextFocus: body.next_focus ?? body.nextFocus ?? null,
              },
            });
            return json({ saved: true });
          }

          if (action === "recommendation") {
            if (user.role !== "therapist" && user.role !== "teacher") {
              return json({ error: "Tidak diizinkan" }, 403);
            }
            await prisma.recommendation.create({
              data: {
                childId: child.id,
                authorId: user.userId,
                audience: (body.audience as any) ?? "parent",
                title: String(body.title ?? "Rekomendasi"),
                description: String(body.description ?? ""),
                category: String(body.category ?? "Support"),
              },
            });
            return json({ saved: true });
          }

          return json({ error: "Unsupported action" }, 400);
        } catch (error) {
          console.error("[api/data POST]", params.action, error);
          return json({ error: "Server error" }, 500);
        }
      },
    },
  },
});
