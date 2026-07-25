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

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET not set in .env");
  return new TextEncoder().encode(value);
};

const LOGIN_ROLES = new Set(["child", "parent", "teacher", "therapist", "admin"]);

function assertLoginRole(role: string) {
  return LOGIN_ROLES.has(role);
}

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
    const role = String(payload.role);
    if (!assertLoginRole(role)) return null;
    return {
      userId: String(payload.userId),
      role,
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

/** Resolve linked child profile(s) by role. Child sees own profile via userId. */
async function childFor(user: { userId: string; role: string }, childId?: string | null) {
  if (user.role === "child") {
    return prisma.childProfile.findFirst({ where: { userId: user.userId } });
  }
  const where =
    user.role === "parent"
      ? { parentId: user.userId }
      : user.role === "teacher"
        ? { teacherId: user.userId }
        : { therapistId: user.userId };
  if (childId) {
    return prisma.childProfile.findFirst({ where: { ...where, id: childId } });
  }
  return prisma.childProfile.findFirst({ where, orderBy: { createdAt: "asc" } });
}

async function childrenFor(user: { userId: string; role: string }) {
  if (user.role === "child") {
    const child = await childFor(user);
    return child ? [child] : [];
  }
  const field =
    user.role === "parent" ? "parentId" : user.role === "teacher" ? "teacherId" : "therapistId";
  return prisma.childProfile.findMany({
    where: { [field]: user.userId },
    orderBy: { name: "asc" },
  });
}

async function roleDashboard(user: { userId: string; role: string }) {
  const children = await childrenFor(user);
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

async function getData(
  action: string,
  user: { userId: string; role: string; email: string },
  childId?: string | null,
) {
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
    const creatorIds = Array.from(
      new Set(resources.map((r) => r.createdBy).filter(Boolean) as string[]),
    );
    const creators = creatorIds.length
      ? await prisma.userProfile.findMany({
          where: { userId: { in: creatorIds } },
          select: { userId: true, fullName: true, email: true },
        })
      : [];
    const creatorMap = new Map(
      creators.map((c) => [c.userId, c.fullName || c.email || "Anggota"]),
    );
    return toSnake(
      resources.map((item) => ({
        ...item,
        author_name: item.createdBy ? creatorMap.get(item.createdBy) ?? "Anggota" : "Sova",
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

  if (action === "children") {
    if (user.role !== "parent") {
      return { children: toSnake(await childrenFor(user)) };
    }
    return { children: toSnake(await childrenFor(user)) };
  }

  if (action === "role-detail" || action === "report") {
    const child = await childFor(user, childId);
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
      children: await childrenFor(user),
      progress,
      weekly,
      observations,
      notes,
      recommendations,
      activities,
    });
  }

  if (action === "admin-stats") {
    if (user.role !== "admin") throw new Error("Forbidden");
    const [users, children, resources, posts, roles] = await Promise.all([
      prisma.userProfile.count(),
      prisma.childProfile.count(),
      prisma.resource.count({ where: { isActive: true } }),
      prisma.communityPost.count(),
      prisma.userRole.groupBy({ by: ["role"], _count: { role: true } }),
    ]);
    return {
      users,
      children,
      resources,
      posts,
      byRole: Object.fromEntries(roles.map((r) => [r.role, r._count.role])),
    };
  }

  if (action === "admin-users") {
    if (user.role !== "admin") throw new Error("Forbidden");
    const profiles = await prisma.userProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: { roles: true },
      take: 200,
    });
    const parentIds = profiles
      .filter((p) => p.roles.some((r) => r.role === "parent"))
      .map((p) => p.userId);
    const children =
      parentIds.length > 0
        ? await prisma.childProfile.findMany({
            where: { parentId: { in: parentIds } },
            select: { id: true, name: true, parentId: true, age: true },
          })
        : [];
    const kidsByParent = new Map<string, typeof children>();
    for (const c of children) {
      const list = kidsByParent.get(c.parentId) ?? [];
      list.push(c);
      kidsByParent.set(c.parentId, list);
    }
    return {
      users: profiles.map((p) => ({
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        language_mode: p.languageMode,
        roles: p.roles.map((r) => r.role),
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
        children: (kidsByParent.get(p.userId) ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          age: c.age,
        })),
      })),
    };
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
            const nextEmail = String(body.email ?? "").trim().toLowerCase();
            if (nextEmail) {
              if (!nextEmail.includes("@")) {
                return json({ error: "Format email tidak valid" }, 400);
              }
              const taken = await prisma.userProfile.findFirst({
                where: { email: nextEmail, NOT: { userId: user.userId } },
              });
              if (taken) return json({ error: "Email sudah digunakan akun lain" }, 409);
            }
            await prisma.$transaction([
              prisma.userProfile.update({
                where: { userId: user.userId },
                data: {
                  fullName: body.full_name ?? body.fullName,
                  languageMode: body.language_mode ?? body.languageMode ?? "hybrid",
                  ...(nextEmail ? { email: nextEmail } : {}),
                },
              }),
              prisma.userSettings.upsert({
                where: { userId: user.userId },
                update: settings,
                create: { userId: user.userId, ...settings },
              }),
            ]);
            return json({ saved: true, email: nextEmail || undefined });
          }

          if (action === "verify-password") {
            const currentPassword = String(body.current_password ?? body.currentPassword ?? "");
            if (!currentPassword) return json({ ok: false }, 200);
            const profile = await prisma.userProfile.findUnique({
              where: { userId: user.userId },
            });
            if (!profile?.passwordHash) return json({ ok: false }, 200);
            const { verifyPassword } = await import("@/lib/password");
            const ok = await verifyPassword(currentPassword, profile.passwordHash);
            return json({ ok });
          }

          if (action === "change-password") {
            const currentPassword = String(body.current_password ?? body.currentPassword ?? "");
            const newPassword = String(body.new_password ?? body.newPassword ?? "");
            if (!currentPassword || !newPassword) {
              return json({ error: "Isi password lama dan password baru" }, 400);
            }
            if (newPassword.length < 8) {
              return json({ error: "Password baru minimal 8 karakter" }, 400);
            }
            const profile = await prisma.userProfile.findUnique({
              where: { userId: user.userId },
            });
            if (!profile?.passwordHash) {
              return json({ error: "Akun tidak memiliki password" }, 400);
            }
            const { verifyPassword, hashPassword } = await import("@/lib/password");
            const ok = await verifyPassword(currentPassword, profile.passwordHash);
            if (!ok) return json({ error: "Password saat ini tidak cocok" }, 401);
            const passwordHash = await hashPassword(newPassword);
            await prisma.userProfile.update({
              where: { userId: user.userId },
              data: { passwordHash },
            });
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

          if (action === "create-child") {
            if (user.role !== "parent") {
              return json({ error: "Hanya orang tua yang bisa membuat akun anak" }, 403);
            }
            const name = String(body.name ?? "").trim();
            const email = String(body.email ?? "").trim().toLowerCase();
            const password = String(body.password ?? "");
            if (!name) return json({ error: "Nama anak wajib diisi" }, 400);
            if (!email || !email.includes("@")) {
              return json({ error: "Email login anak wajib diisi" }, 400);
            }
            if (password.length < 8) {
              return json({ error: "Password anak minimal 8 karakter" }, 400);
            }
            const existing = await prisma.userProfile.findFirst({ where: { email } });
            if (existing) {
              return json({ error: "Email sudah terpakai. Gunakan email lain untuk anak." }, 409);
            }

            const { hashPassword } = await import("@/lib/password");
            const { v4: uuidv4 } = await import("uuid");
            const childUserId = uuidv4();
            const passwordHash = await hashPassword(password);
            const ageRaw = body.age;
            const age =
              ageRaw === undefined || ageRaw === null || ageRaw === ""
                ? null
                : Number(ageRaw);

            const child = await prisma.$transaction(async (tx) => {
              await tx.userProfile.create({
                data: {
                  userId: childUserId,
                  email,
                  fullName: name,
                  passwordHash,
                },
              });
              await tx.userRole.create({ data: { userId: childUserId, role: "child" } });
              await tx.userSettings.create({ data: { userId: childUserId } });
              const created = await tx.childProfile.create({
                data: {
                  parentId: user.userId,
                  userId: childUserId,
                  name,
                  age: Number.isFinite(age as number) ? (age as number) : null,
                  diagnosisLevel:
                    String(body.diagnosis_level ?? body.diagnosisLevel ?? "").trim() || null,
                  learningGoal:
                    String(body.learning_goal ?? body.learningGoal ?? "").trim() ||
                    "Melatih komunikasi sosial bersama Sova",
                },
              });
              await tx.learningProgress.create({
                data: { childId: created.id, totalMissions: 6, weeklyGoal: 6 },
              });
              await tx.careTeamMember.create({
                data: {
                  childId: created.id,
                  userId: user.userId,
                  role: "parent",
                  status: "active",
                  invitedBy: user.userId,
                },
              });
              return created;
            });

            return json({
              saved: true,
              child: toSnake(child),
              login: { email, role: "child" },
            });
          }

          if (action === "delete-child") {
            if (user.role !== "parent") {
              return json({ error: "Hanya orang tua yang bisa menghapus akun anak" }, 403);
            }
            const childId = String(body.child_id ?? body.childId ?? "").trim();
            if (!childId) return json({ error: "ID anak wajib diisi" }, 400);
            const child = await prisma.childProfile.findFirst({
              where: { id: childId, parentId: user.userId },
            });
            if (!child) return json({ error: "Profil anak tidak ditemukan" }, 404);

            const childUserId = child.userId;
            await prisma.$transaction(async (tx) => {
              await tx.childProfile.delete({ where: { id: child.id } });
              if (childUserId) {
                await tx.userRole.deleteMany({ where: { userId: childUserId } });
                await tx.userSettings.deleteMany({ where: { userId: childUserId } });
                await tx.careTeamMember.deleteMany({ where: { userId: childUserId } });
                await tx.userProfile.deleteMany({ where: { userId: childUserId } });
              }
            });
            return json({ saved: true, deleted: true });
          }

          if (action === "link-care-team") {
            if (user.role !== "parent") {
              return json({ error: "Hanya orang tua yang bisa menghubungkan care team" }, 403);
            }
            const childId = String(body.child_id ?? body.childId ?? "");
            const memberEmail = String(body.email ?? "").trim().toLowerCase();
            const memberRole = String(body.role ?? "") as "teacher" | "therapist";
            if (!childId || !memberEmail || !["teacher", "therapist"].includes(memberRole)) {
              return json({ error: "child_id, email, dan role (teacher|therapist) wajib" }, 400);
            }
            const child = await prisma.childProfile.findFirst({
              where: { id: childId, parentId: user.userId },
            });
            if (!child) return json({ error: "Profil anak tidak ditemukan" }, 404);
            const member = await prisma.userProfile.findFirst({
              where: { email: memberEmail },
              include: { roles: true },
            });
            if (!member || !member.roles.some((r) => r.role === memberRole)) {
              return json(
                { error: `Akun ${memberRole} dengan email tersebut tidak ditemukan` },
                404,
              );
            }
            await prisma.careTeamMember.upsert({
              where: {
                childId_userId_role: {
                  childId: child.id,
                  userId: member.userId,
                  role: memberRole,
                },
              },
              update: { status: "active", invitedBy: user.userId },
              create: {
                childId: child.id,
                userId: member.userId,
                role: memberRole,
                status: "active",
                invitedBy: user.userId,
              },
            });
            await prisma.childProfile.update({
              where: { id: child.id },
              data:
                memberRole === "teacher"
                  ? { teacherId: member.userId }
                  : { therapistId: member.userId },
            });
            return json({ saved: true });
          }

          if (action === "admin-set-role") {
            if (user.role !== "admin") return json({ error: "Hanya admin" }, 403);
            const targetId = String(body.user_id ?? body.userId ?? "").trim();
            const newRole = String(body.role ?? "").trim();
            if (!targetId || !["parent", "teacher", "therapist", "admin", "child"].includes(newRole)) {
              return json({ error: "user_id dan role wajib" }, 400);
            }
            if (targetId === user.userId && newRole !== "admin") {
              return json({ error: "Tidak bisa menghapus role admin dari akun sendiri" }, 400);
            }
            await prisma.userRole.deleteMany({ where: { userId: targetId } });
            await prisma.userRole.create({
              data: { userId: targetId, role: newRole as any },
            });
            return json({ saved: true });
          }

          if (action === "admin-create-user") {
            if (user.role !== "admin") return json({ error: "Hanya admin" }, 403);
            const fullName = String(body.full_name ?? body.fullName ?? "").trim();
            const email = String(body.email ?? "").trim().toLowerCase();
            const password = String(body.password ?? "").trim();
            const role = String(body.role ?? "teacher").trim();
            if (!fullName) return json({ error: "Nama wajib diisi" }, 400);
            if (!email || !email.includes("@")) return json({ error: "Email tidak valid" }, 400);
            if (password.length < 8) return json({ error: "Password minimal 8 karakter" }, 400);
            if (!["parent", "teacher", "therapist", "admin"].includes(role)) {
              return json({ error: "Peran tidak valid" }, 400);
            }
            const existing = await prisma.userProfile.findFirst({ where: { email } });
            if (existing) return json({ error: "Email sudah terdaftar" }, 409);
            const { hashPassword } = await import("@/lib/password");
            const { v4: uuidv4 } = await import("uuid");
            const userId = uuidv4();
            const passwordHash = await hashPassword(password);
            await prisma.$transaction([
              prisma.userProfile.create({
                data: { userId, email, fullName, passwordHash },
              }),
              prisma.userRole.create({ data: { userId, role: role as any } }),
              prisma.userSettings.create({ data: { userId } }),
            ]);
            return json({ saved: true, user_id: userId });
          }

          if (action === "admin-update-user") {
            if (user.role !== "admin") return json({ error: "Hanya admin" }, 403);
            const targetId = String(body.user_id ?? body.userId ?? "").trim();
            if (!targetId) return json({ error: "Pengguna tidak ditemukan" }, 400);
            const existing = await prisma.userProfile.findUnique({
              where: { userId: targetId },
              include: { roles: true },
            });
            if (!existing) return json({ error: "Pengguna tidak ditemukan" }, 404);

            const fullName = String(body.full_name ?? body.fullName ?? existing.fullName ?? "").trim();
            const email = String(body.email ?? existing.email ?? "")
              .trim()
              .toLowerCase();
            const newRole = String(body.role ?? existing.roles[0]?.role ?? "parent").trim();
            const newPassword = String(body.new_password ?? body.newPassword ?? "").trim();

            if (!fullName) return json({ error: "Nama wajib diisi" }, 400);
            if (!email || !email.includes("@")) return json({ error: "Email tidak valid" }, 400);
            if (!["parent", "teacher", "therapist", "admin", "child"].includes(newRole)) {
              return json({ error: "Peran tidak valid" }, 400);
            }
            if (targetId === user.userId && newRole !== "admin") {
              return json({ error: "Tidak bisa menghapus peran admin dari akun sendiri" }, 400);
            }
            if (newPassword && newPassword.length < 8) {
              return json({ error: "Password baru minimal 8 karakter" }, 400);
            }

            const emailTaken = await prisma.userProfile.findFirst({
              where: { email, NOT: { userId: targetId } },
            });
            if (emailTaken) return json({ error: "Email sudah digunakan akun lain" }, 409);

            const data: { fullName: string; email: string; passwordHash?: string } = {
              fullName,
              email,
            };
            if (newPassword) {
              const { hashPassword } = await import("@/lib/password");
              data.passwordHash = await hashPassword(newPassword);
            }

            await prisma.$transaction(async (tx) => {
              await tx.userProfile.update({
                where: { userId: targetId },
                data,
              });
              const currentRole = existing.roles[0]?.role;
              if (currentRole !== newRole) {
                await tx.userRole.deleteMany({ where: { userId: targetId } });
                await tx.userRole.create({
                  data: { userId: targetId, role: newRole as any },
                });
              }
            });
            return json({ saved: true });
          }

          if (action === "admin-delete-post") {
            if (user.role !== "admin") return json({ error: "Hanya admin" }, 403);
            const postId = String(body.post_id ?? body.postId ?? "").trim();
            if (!postId) return json({ error: "Postingan tidak valid" }, 400);
            await prisma.communityReply.deleteMany({ where: { postId } });
            await prisma.communityLike.deleteMany({ where: { postId } });
            await prisma.communityPost.delete({ where: { id: postId } });
            return json({ saved: true, deleted: true });
          }

          if (action === "admin-delete-reply") {
            if (user.role !== "admin") return json({ error: "Hanya admin" }, 403);
            const replyId = String(body.reply_id ?? body.replyId ?? "").trim();
            if (!replyId) return json({ error: "Balasan tidak valid" }, 400);
            const reply = await prisma.communityReply.findUnique({ where: { id: replyId } });
            if (!reply) return json({ error: "Balasan tidak ditemukan" }, 404);
            await prisma.$transaction([
              prisma.communityReply.delete({ where: { id: replyId } }),
              prisma.communityPost.update({
                where: { id: reply.postId },
                data: { comments: { decrement: 1 } },
              }),
            ]);
            return json({ saved: true, deleted: true });
          }

          if (action === "admin-delete-user") {
            if (user.role !== "admin") return json({ error: "Hanya admin" }, 403);
            const targetId = String(body.user_id ?? body.userId ?? "").trim();
            if (!targetId) return json({ error: "Pengguna tidak ditemukan" }, 400);
            if (targetId === user.userId) {
              return json({ error: "Tidak bisa menghapus akun sendiri" }, 400);
            }
            const target = await prisma.userProfile.findUnique({
              where: { userId: targetId },
              include: { roles: true },
            });
            if (!target) return json({ error: "Pengguna tidak ditemukan" }, 404);
            // Soft-clean: remove roles/settings, child links if parent, then profile
            await prisma.$transaction(async (tx) => {
              await tx.careTeamMember.deleteMany({ where: { userId: targetId } });
              await tx.userRole.deleteMany({ where: { userId: targetId } });
              await tx.userSettings.deleteMany({ where: { userId: targetId } });
              // Children owned by this parent
              const kids = await tx.childProfile.findMany({
                where: { parentId: targetId },
                select: { id: true, userId: true },
              });
              for (const kid of kids) {
                await tx.childProfile.delete({ where: { id: kid.id } });
                if (kid.userId) {
                  await tx.userRole.deleteMany({ where: { userId: kid.userId } });
                  await tx.userSettings.deleteMany({ where: { userId: kid.userId } });
                  await tx.userProfile.deleteMany({ where: { userId: kid.userId } });
                }
              }
              // Unlink as teacher/therapist
              await tx.childProfile.updateMany({
                where: { teacherId: targetId },
                data: { teacherId: null },
              });
              await tx.childProfile.updateMany({
                where: { therapistId: targetId },
                data: { therapistId: null },
              });
              await tx.communityPost.deleteMany({ where: { authorId: targetId } });
              await tx.communityReply.deleteMany({ where: { authorId: targetId } });
              await tx.communityLike.deleteMany({ where: { userId: targetId } });
              await tx.userProfile.delete({ where: { userId: targetId } });
            });
            return json({ saved: true, deleted: true });
          }

          if (action === "resource" || action === "update-resource" || action === "delete-resource") {
            const canManage =
              user.role === "teacher" || user.role === "therapist" || user.role === "admin";

            if (action === "delete-resource") {
              if (!canManage) return json({ error: "Tidak diizinkan menghapus materi" }, 403);
              const id = String(body.id ?? body.resource_id ?? "").trim();
              if (!id) return json({ error: "Materi tidak ditemukan" }, 400);
              const existing = await prisma.resource.findUnique({ where: { id } });
              if (!existing) return json({ error: "Materi tidak ditemukan" }, 404);
              await prisma.resource.update({
                where: { id },
                data: { isActive: false },
              });
              return json({ saved: true, deleted: true });
            }

            if (!canManage) {
              return json({ error: "Tidak diizinkan menambah atau mengubah materi" }, 403);
            }

            const title = String(body.title ?? "").trim();
            const description = String(body.description ?? "").trim();
            let category = String(body.category ?? "Guide").trim() || "Guide";
            let url = String(body.url ?? "").trim() || null;
            if (!title || !description) return json({ error: "Judul dan ringkasan wajib diisi" }, 400);

            // Sova animation template (stored in url as sova-lesson:*)
            const lesson = String(body.lesson ?? "neutral").trim() || "neutral";
            const lessonOk = [
              "neutral",
              "conversation",
              "breathing",
              "emotions",
              "story",
              "sensory",
            ].includes(lesson);
            if (lessonOk && !url) {
              url = `sova-lesson:${lesson}`;
              if (category === "Guide") {
                category =
                  lesson === "conversation" || lesson === "breathing" ? "Video" : "Guide";
              }
            }

            const mediaDataUrl = String(body.media_data_url ?? body.mediaDataUrl ?? "").trim();
            if (mediaDataUrl.startsWith("data:")) {
              const match = mediaDataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (!match) return json({ error: "File tidak bisa dibaca" }, 400);
              const mime = match[1].toLowerCase();
              const b64 = match[2];
              const allowed = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
                "video/mp4",
                "video/webm",
              ];
              if (!allowed.includes(mime)) {
                return json({ error: "Gunakan foto JPG/PNG atau video MP4" }, 400);
              }
              // ~30MB raw → base64 is larger
              if (b64.length > 42_000_000) {
                return json({ error: "File terlalu besar. Maksimal 30 MB." }, 400);
              }
              const ext =
                mime === "image/jpeg"
                  ? "jpg"
                  : mime === "image/png"
                    ? "png"
                    : mime === "image/webp"
                      ? "webp"
                      : mime === "image/gif"
                        ? "gif"
                        : mime === "video/webm"
                          ? "webm"
                          : "mp4";
              if (mime.startsWith("video/")) category = "Video";
              else if (category === "Guide") category = "Worksheet";

              try {
                const { mkdir, writeFile } = await import("node:fs/promises");
                const { join } = await import("node:path");
                const dir = join(process.cwd(), "public", "uploads", "resources");
                await mkdir(dir, { recursive: true });
                const fileName = `${Date.now()}-${user.userId.slice(0, 8)}.${ext}`;
                await writeFile(join(dir, fileName), Buffer.from(b64, "base64"));
                // File upload wins over lesson template in url
                url = `/uploads/resources/${fileName}`;
              } catch (err) {
                console.error("[resource upload]", err);
                return json({ error: "Gagal menyimpan file. Coba lagi dengan file lebih kecil." }, 500);
              }
            } else if (lessonOk) {
              // Keep / re-apply lesson template when not uploading a new file
              url = `sova-lesson:${lesson}`;
            }

            if (action === "update-resource") {
              const id = String(body.id ?? body.resource_id ?? "").trim();
              if (!id) return json({ error: "Materi tidak ditemukan" }, 400);
              const existing = await prisma.resource.findUnique({ where: { id } });
              if (!existing || !existing.isActive) return json({ error: "Materi tidak ditemukan" }, 404);
              const nextUrl =
                url && (url.startsWith("/uploads/") || url.startsWith("sova-lesson:"))
                  ? url
                  : lessonOk
                    ? `sova-lesson:${lesson}`
                    : existing.url;
              const updated = await prisma.resource.update({
                where: { id },
                data: {
                  title,
                  description,
                  category,
                  url: nextUrl,
                  // mark as managed after first staff edit
                  createdBy: existing.createdBy ?? user.userId,
                },
              });
              return json({ saved: true, resource: toSnake(updated) });
            }

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

          const bodyChildId = String(body.child_id ?? body.childId ?? "").trim() || null;
          const child = await childFor(user, bodyChildId);
          if (!child) return json({ saved: false, error: "Pilih anak / klien terlebih dahulu" }, 404);

          // Learning activity writes: child account (or parent assisting)
          if (
            ["simulation", "story", "emotion"].includes(action) &&
            user.role !== "child" &&
            user.role !== "parent"
          ) {
            return json({ error: "Hanya akun anak (atau parent) yang bisa menyimpan latihan." }, 403);
          }

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
