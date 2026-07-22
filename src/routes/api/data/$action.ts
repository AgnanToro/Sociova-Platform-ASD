import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

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
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
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

async function childFor(user: { userId: string; role: string }) {
  const where =
    user.role === "child"
      ? { userId: user.userId }
      : user.role === "parent"
        ? { parentId: user.userId }
        : user.role === "teacher"
          ? { teacherId: user.userId }
          : { therapistId: user.userId };
  return prisma.childProfile.findFirst({ where, orderBy: { createdAt: "asc" } });
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

async function loadCommunity() {
  const posts = await prisma.communityPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
        take: 8,
      },
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

async function getData(action: string, user: { userId: string; role: string }) {
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
          take: 5,
        }),
        prisma.recommendation.findMany({
          where: { childId: child.id, audience: user.role as any },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
      ]);
    const dailyMission = missions.find((mission) => mission.missionType === "daily") ?? null;
    return {
      demoMode: false,
      profile: toSnake(profile),
      child: toSnake(child),
      progress: toSnake(progress),
      dailyMission: toSnake(dailyMission),
      weeklyMission: toSnake(missions.find((mission) => mission.missionType === "weekly") ?? null),
      recentSessions: toSnake(sessions),
      recentStories: toSnake(stories),
      latestEmotion: toSnake(emotion),
      recentActivity: toSnake(activity),
      recommendations: toSnake(recommendations),
      missionProgress: {
        done: progress?.completedMissions ?? 0,
        total: progress?.totalMissions || 1,
        value: Math.round(
          ((progress?.completedMissions ?? 0) / (progress?.totalMissions || 1)) * 100,
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
            take: 5,
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

  if (action === "community") return loadCommunity();

  if (action === "resources") {
    return toSnake(
      (
        await prisma.resource.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        })
      ).map((item) => ({
        ...item,
        time: item.category === "Worksheet" ? "PDF" : "5 min read",
      })),
    );
  }

  if (action === "settings") {
    const [profile, settings] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: user.userId } }),
      prisma.userSettings.findUnique({ where: { userId: user.userId } }),
    ]);
    return toSnake({ profile, settings, role: user.role });
  }

  if (action === "role") return roleDashboard(user);

  if (action === "role-detail") {
    const child = await childFor(user);
    if (!child) return {};
    const [weekly, observations, notes, recommendations, activities] = await Promise.all([
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
    return toSnake({ child, weekly, observations, notes, recommendations, activities });
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
          return json(await getData(params.action, user));
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
            await prisma.communityPost.update({
              where: { id: postId },
              data: { likes: { increment: 1 } },
            });
            return json({ saved: true });
          }

          const child = await childFor(user);
          if (!child) return json({ saved: false, error: "Profil anak belum terhubung" }, 404);

          if (action === "simulation") {
            await prisma.simulationSession.create({
              data: {
                childId: child.id,
                scenario: body.scenario,
                conversation: body.conversation,
                score: body.score,
                feedback: body.feedback,
                strength: body.strength,
                suggestion: body.suggestion,
              },
            });
            await prisma.activityHistory.create({
              data: {
                childId: child.id,
                title: `Simulasi: ${body.scenario}`,
                category: "AI Simulation",
                score: body.score,
                detail: body.feedback,
              },
            });
            return json({ saved: true });
          }

          if (action === "story") {
            const title =
              body.situation.length > 42 ? `${body.situation.slice(0, 42)}...` : body.situation;
            await prisma.socialStory.create({
              data: {
                childId: child.id,
                title,
                situation: body.situation,
                generatedStory: body.generatedStory,
              },
            });
            return json({ saved: true });
          }

          if (action === "emotion") {
            await prisma.emotionAnalysis.create({
              data: {
                childId: child.id,
                inputText: body.input_text,
                detectedEmotion: body.detected_emotion,
                confidence: body.confidence,
                recommendation: body.recommendation,
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
