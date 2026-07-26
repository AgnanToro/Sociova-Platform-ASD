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
import {
  BADGE_CATALOG,
  missionStepsFor,
  xpToCoins,
  xpToLevel,
} from "@/lib/child-game";
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

async function ensureProgress(childId: string) {
  const existing = await prisma.learningProgress.findFirst({ where: { childId } });
  if (existing) return existing;
  return prisma.learningProgress.create({
    data: { childId, xp: 0, level: 1, streak: 0, weeklyGoal: 5, completedMissions: 0, totalMissions: 4 },
  });
}

async function awardProgress(
  childId: string,
  opts: {
    xp?: number;
    missionStep?: boolean;
    category?: string;
    title?: string;
    score?: number | null;
    detail?: string | null;
    skill?: Partial<{
      communicationScore: number;
      confidenceScore: number;
      empathyScore: number;
      greetingScore: number;
      listeningScore: number;
      conversationScore: number;
    }>;
  },
) {
  const progress = await ensureProgress(childId);
  const addXp = Math.max(0, opts.xp ?? 0);
  const nextXp = progress.xp + addXp;
  const nextLevel = Math.max(progress.level, xpToLevel(nextXp));
  const missionBump = opts.missionStep ? 1 : 0;
  const nextCompleted = Math.min(
    (progress.completedMissions ?? 0) + missionBump,
    Math.max(progress.totalMissions || 4, (progress.completedMissions ?? 0) + missionBump),
  );

  // Streak: +1 if last activity was yesterday or first today; keep if already today
  let nextStreak = progress.streak ?? 0;
  const last = await prisma.activityHistory.findFirst({
    where: { childId },
    orderBy: { completedAt: "desc" },
  });
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (!last) {
    nextStreak = Math.max(1, nextStreak);
  } else {
    const lastDate = new Date(last.completedAt);
    if (lastDate >= startOfToday) {
      // same day — keep streak, ensure at least 1
      nextStreak = Math.max(1, nextStreak);
    } else if (lastDate >= startOfYesterday) {
      nextStreak = Math.max(1, nextStreak) + 1;
    } else {
      nextStreak = 1;
    }
  }

  const skill = opts.skill ?? {};
  const updated = await prisma.learningProgress.update({
    where: { id: progress.id },
    data: {
      xp: nextXp,
      level: nextLevel,
      streak: nextStreak,
      completedMissions: nextCompleted,
      totalMissions: Math.max(progress.totalMissions || 4, nextCompleted),
      communicationScore: Math.max(progress.communicationScore, skill.communicationScore ?? 0),
      confidenceScore: Math.max(progress.confidenceScore, skill.confidenceScore ?? 0),
      empathyScore: Math.max(progress.empathyScore, skill.empathyScore ?? 0),
      greetingScore: Math.max(progress.greetingScore, skill.greetingScore ?? 0),
      listeningScore: Math.max(progress.listeningScore, skill.listeningScore ?? 0),
      conversationScore: Math.max(progress.conversationScore, skill.conversationScore ?? 0),
    },
  });

  if (opts.title) {
    await prisma.activityHistory.create({
      data: {
        childId,
        title: opts.title,
        category: opts.category ?? "Latihan",
        score: opts.score ?? null,
        detail: opts.detail ?? null,
      },
    });
  }

  const newBadges = await unlockBadges(childId, updated);
  return {
    progress: updated,
    coins: xpToCoins(updated.xp),
    xpGained: addXp,
    leveledUp: nextLevel > progress.level,
    newBadges,
  };
}

async function unlockBadges(
  childId: string,
  progress: { xp: number; level: number; streak: number; completedMissions: number },
) {
  const [earned, sessionCount, emotionCount, journeyDone] = await Promise.all([
    prisma.achievement.findMany({ where: { childId } }),
    prisma.simulationSession.count({ where: { childId } }),
    prisma.emotionAnalysis.count({ where: { childId } }),
    prisma.userJourneyProgress.count({ where: { childId, status: "completed" } }),
  ]);
  const earnedNames = new Set(earned.map((b) => b.name));
  const unlocked: Array<{ name: string; description: string }> = [];

  for (const badge of BADGE_CATALOG) {
    if (earnedNames.has(badge.name)) continue;
    const b = badge as Record<string, unknown>;
    const ok =
      (typeof b.minSessions === "number" && sessionCount >= b.minSessions) ||
      (typeof b.minEmotions === "number" && emotionCount >= b.minEmotions) ||
      (typeof b.minStreak === "number" && progress.streak >= b.minStreak) ||
      (typeof b.minLevel === "number" && progress.level >= b.minLevel) ||
      (typeof b.minMissions === "number" && progress.completedMissions >= b.minMissions) ||
      (typeof b.minJourney === "number" && journeyDone >= b.minJourney);
    if (!ok) continue;
    await prisma.achievement.create({
      data: { childId, name: badge.name, description: badge.description },
    });
    unlocked.push({ name: badge.name, description: badge.description });
  }
  return unlocked;
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

async function analyticsFor(
  user: { userId: string; role: string },
  childId?: string | null,
) {
  const kids = await childrenFor(user);
  const child = childId
    ? (kids.find((k) => k.id === childId) ?? (await childFor(user, childId)))
    : await childFor(user);
  if (!child) {
    return {
      demoMode: true,
      child: demoChild,
      children: [],
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
    children: toSnake(kids),
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

    // Daily mission = activities completed today (not lifetime total)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dailyTarget = Math.min(
      4,
      Math.max(1, dailyMission?.targetCount ?? 3),
    );
    const todayActivities = await prisma.activityHistory.count({
      where: {
        childId: child.id,
        completedAt: { gte: startOfToday },
        category: { in: ["AI Simulation", "Journey", "Emotion", "Social Story", "Mission"] },
      },
    });
    const dailyDone = Math.min(todayActivities, dailyTarget);
    const missionSteps = missionStepsFor(dailyTarget);

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
        done: dailyDone,
        total: dailyTarget,
        value: Math.round((dailyDone / dailyTarget) * 100),
      },
      missionSteps,
      coins: xpToCoins(progress?.xp ?? 0),
    };
  }

  if (action === "journey") {
    const child = await childFor(user);
    const levels = await prisma.journeyLevel.findMany({ orderBy: { levelOrder: "asc" } });
    const rows = child
      ? await prisma.userJourneyProgress.findMany({ where: { childId: child.id } })
      : [];
    const statuses = new Map(rows.map((row) => [row.journeyLevelId, row.status]));
    const { scenarioForJourney, simulationPlayHref } = await import("@/lib/journey-map");
    const mapped = levels.map((level, index) => {
      let status = statuses.get(level.id) ?? (index === 0 ? "in_progress" : "locked");
      if (!child) {
        status = index === 0 ? "completed" : index === 1 ? "in_progress" : "locked";
      }
      // unlock chain: if previous completed but this locked without row, keep locked unless first
      if (child && index > 0 && !statuses.has(level.id)) {
        const prev = levels[index - 1];
        const prevStatus = statuses.get(prev.id);
        if (prevStatus === "completed") status = "in_progress";
        else status = "locked";
      }
      const scenario = scenarioForJourney(level.title);
      return {
        ...level,
        status,
        scenario,
        play_href: simulationPlayHref({
          scenario,
          journeyLevelId: status === "locked" ? null : level.id,
        }),
      };
    });
    return {
      demoMode: !child,
      levels: toSnake(mapped),
    };
  }

  if (action === "simulation") {
    const child = await childFor(user);
    const scenarios = await prisma.simulationScenario.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    const { scenarioForJourney } = await import("@/lib/journey-map");
    let unlockedScenarios = new Set(scenarios.map((s) => s.title));
    let journeyByScenario = new Map<string, string>();
    if (child) {
      const levels = await prisma.journeyLevel.findMany({ orderBy: { levelOrder: "asc" } });
      const rows = await prisma.userJourneyProgress.findMany({ where: { childId: child.id } });
      const statusMap = new Map(rows.map((r) => [r.journeyLevelId, r.status]));
      unlockedScenarios = new Set<string>();
      levels.forEach((level, index) => {
        let status = statusMap.get(level.id) ?? (index === 0 ? "in_progress" : "locked");
        if (index > 0 && !statusMap.has(level.id)) {
          const prev = levels[index - 1];
          status = statusMap.get(prev.id) === "completed" ? "in_progress" : "locked";
        }
        const scenario = scenarioForJourney(level.title);
        journeyByScenario.set(scenario, level.id);
        if (status === "completed" || status === "in_progress") {
          unlockedScenarios.add(scenario);
        }
      });
      // always allow first scenario if nothing unlocked
      if (!unlockedScenarios.size && scenarios[0]) unlockedScenarios.add(scenarios[0].title);
    }
    return toSnake(
      scenarios.map((s) => ({
        ...s,
        unlocked: unlockedScenarios.has(s.title),
        journey_level_id: journeyByScenario.get(s.title) ?? null,
      })),
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
    const [progress, earned, missions, sessionCount, emotionCount] = await Promise.all([
      prisma.learningProgress.findFirst({ where: { childId: child.id } }),
      prisma.achievement.findMany({ where: { childId: child.id } }),
      prisma.mission.findMany({ where: { isActive: true } }),
      prisma.simulationSession.count({ where: { childId: child.id } }),
      prisma.emotionAnalysis.count({ where: { childId: child.id } }),
    ]);
    const earnedNames = new Set(earned.map((b) => b.name));
    const catalog: Array<{
      name: string;
      description: string;
      icon: string;
      earned: boolean;
      unlocked_at: Date | null;
    }> = BADGE_CATALOG.map((badge) => {
      const found = earned.find((b) => b.name === badge.name);
      return {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earned: earnedNames.has(badge.name),
        unlocked_at: found?.unlockedAt ?? null,
      };
    });
    for (const badge of earned) {
      if (!catalog.some((c) => c.name === badge.name)) {
        catalog.push({
          name: badge.name,
          description: badge.description ?? "",
          icon: "award",
          earned: true,
          unlocked_at: badge.unlockedAt,
        });
      }
    }
    const dailyMission = missions.find((m) => m.missionType === "daily") ?? null;
    const weeklyMission = missions.find((m) => m.missionType === "weekly") ?? null;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));
    const dailyTarget = Math.min(4, Math.max(1, dailyMission?.targetCount ?? 3));
    const weeklyTarget = weeklyMission?.targetCount ?? progress?.weeklyGoal ?? 6;
    const [todayCount, weekCount] = await Promise.all([
      prisma.activityHistory.count({
        where: {
          childId: child.id,
          completedAt: { gte: startOfToday },
          category: { in: ["AI Simulation", "Journey", "Emotion", "Social Story", "Mission"] },
        },
      }),
      prisma.activityHistory.count({
        where: {
          childId: child.id,
          completedAt: { gte: startOfWeek },
          category: { in: ["AI Simulation", "Journey", "Emotion", "Social Story", "Mission"] },
        },
      }),
    ]);
    const dailyDone = Math.min(todayCount, dailyTarget);
    const weeklyDone = Math.min(weekCount, weeklyTarget);
    return {
      demoMode: false,
      progress: toSnake(progress),
      coins: xpToCoins(progress?.xp ?? 0),
      achievements: toSnake(catalog),
      dailyMission: toSnake(dailyMission),
      weeklyMission: toSnake(weeklyMission),
      missionProgress: {
        done: dailyDone,
        total: dailyTarget,
        value: Math.round((dailyDone / Math.max(dailyTarget, 1)) * 100),
      },
      weeklyProgress: {
        done: weeklyDone,
        total: weeklyTarget,
        value: Math.round((weeklyDone / Math.max(weeklyTarget, 1)) * 100),
      },
      stats: { sessions: sessionCount, emotions: emotionCount },
    };
  }

  if (action === "community") return loadCommunity(user.userId);
  if (action === "analytics") return analyticsFor(user, childId);

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
    const kids = await childrenFor(user);
    const childIds = kids.map((k) => k.id);
    const childName = (id: string) => kids.find((k) => k.id === id)?.name ?? "Anak";
    type Notif = {
      id: string;
      title: string;
      body: string;
      time: string;
      type: string;
      at?: number;
    };
    const items: Notif[] = [];
    const wantMission = settings?.dailyMissionReminder !== false;
    const wantWeekly = settings?.weeklyProgressReport !== false;
    const wantCommunity = Boolean(settings?.communityReplies);
    const dayKey = new Date().toISOString().slice(0, 10);
    const weekKey = (() => {
      const d = new Date();
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${week}`;
    })();
    // Static reminders: only once per day/week (id changes → counts as new)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    if (user.role === "child") {
      if (wantMission) {
        items.push({
          id: `mission-${dayKey}`,
          title: "Misi harian",
          body: "Yuk selesaikan misi hari ini biar streak tetap jalan!",
          time: "Hari ini",
          type: "mission",
          at: startOfToday.getTime(),
        });
      }
      if (wantWeekly) {
        items.push({
          id: `weekly-${weekKey}`,
          title: "Progres minggu ini",
          body: "Lihat seberapa hebat latihanmu di menu Perjalanan atau Pencapaian.",
          time: "Minggu ini",
          type: "report",
          at: startOfWeek.getTime(),
        });
      }
    } else if (user.role === "parent") {
      if (wantMission && kids.length) {
        const names = kids.map((k) => k.name).join(", ");
        items.push({
          id: `mission-${dayKey}`,
          title: "Pengingat misi anak",
          body:
            kids.length === 1
              ? `Ingatkan ${names} menyelesaikan misi harian hari ini.`
              : `Ingatkan anak (${names}) menyelesaikan misi harian hari ini.`,
          time: "Hari ini",
          type: "mission",
          at: startOfToday.getTime(),
        });
      }
      if (wantWeekly && kids.length) {
        items.push({
          id: `weekly-${weekKey}`,
          title: "Laporan mingguan siap",
          body: "Buka Laporan Mingguan atau Analitik untuk meninjau perkembangan anak.",
          time: "Minggu ini",
          type: "report",
          at: startOfWeek.getTime(),
        });
      }
      if (!kids.length) {
        items.push({
          id: "no-child",
          title: "Belum ada akun anak",
          body: "Buat akun anak di menu Kelola Anak agar progres bisa dipantau.",
          time: "Sekarang",
          type: "info",
          at: startOfToday.getTime(),
        });
      }
    } else if (user.role === "teacher") {
      if (kids.length) {
        items.push({
          id: `students-${kids.map((k) => k.id).sort().join(",")}`,
          title: "Siswa terhubung",
          body:
            kids.length === 1
              ? `Anda terhubung dengan ${kids[0].name}. Tambahkan observasi di menu Observasi.`
              : `Anda memantau ${kids.length} siswa. Catat observasi terbaru di menu Observasi.`,
          time: "Hari ini",
          type: "info",
          at: startOfToday.getTime(),
        });
      } else {
        items.push({
          id: "no-students",
          title: "Belum ada siswa",
          body: "Menunggu orang tua menghubungkan Anda ke profil anak.",
          time: "Sekarang",
          type: "info",
          at: startOfToday.getTime(),
        });
      }
      if (wantWeekly && kids.length) {
        items.push({
          id: `weekly-${weekKey}`,
          title: "Laporan kelas",
          body: "Ringkasan mingguan siswa siap ditinjau di menu Laporan.",
          time: "Minggu ini",
          type: "report",
          at: startOfWeek.getTime(),
        });
      }
    } else if (user.role === "therapist") {
      if (kids.length) {
        items.push({
          id: `clients-${kids.map((k) => k.id).sort().join(",")}`,
          title: "Klien terhubung",
          body:
            kids.length === 1
              ? `Anda terhubung dengan ${kids[0].name}. Perbarui catatan sesi di menu Catatan.`
              : `Anda memantau ${kids.length} klien. Perbarui catatan sesi di menu Catatan.`,
          time: "Hari ini",
          type: "info",
          at: startOfToday.getTime(),
        });
      } else {
        items.push({
          id: "no-clients",
          title: "Belum ada klien",
          body: "Menunggu orang tua menghubungkan Anda ke profil anak.",
          time: "Sekarang",
          type: "info",
          at: startOfToday.getTime(),
        });
      }
      if (wantWeekly && kids.length) {
        items.push({
          id: `weekly-${weekKey}`,
          title: "Laporan klien",
          body: "Ringkasan mingguan klien siap ditinjau di menu Laporan.",
          time: "Minggu ini",
          type: "report",
          at: startOfWeek.getTime(),
        });
      }
    } else if (user.role === "admin") {
      items.push({
        id: `admin-${dayKey}`,
        title: "Panel admin",
        body: "Kelola pengguna, komunitas, dan konten dari menu Admin.",
        time: "Hari ini",
        type: "info",
        at: startOfToday.getTime(),
      });
    }

    if (wantCommunity && user.role !== "child") {
      items.push({
        id: `community-${dayKey}`,
        title: "Komunitas",
        body: "Ada balasan baru di Komunitas. Buka menu Komunitas untuk melihatnya.",
        time: "Baru",
        type: "community",
        at: startOfToday.getTime(),
      });
    }

    if (childIds.length && user.role !== "admin") {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const [observations, notes, activities] = await Promise.all([
        user.role === "teacher"
          ? Promise.resolve([])
          : prisma.teacherObservation.findMany({
              where: { childId: { in: childIds }, observedAt: { gte: since } },
              orderBy: { observedAt: "desc" },
              take: 5,
            }),
        user.role === "therapist"
          ? Promise.resolve([])
          : prisma.therapistNote.findMany({
              where: { childId: { in: childIds }, sessionAt: { gte: since } },
              orderBy: { sessionAt: "desc" },
              take: 5,
            }),
        prisma.activityHistory.findMany({
          where: { childId: { in: childIds }, completedAt: { gte: since } },
          orderBy: { completedAt: "desc" },
          take: 6,
        }),
      ]);

      for (const obs of observations) {
        const name = childName(obs.childId);
        items.push({
          id: `obs-${obs.id}`,
          title:
            user.role === "parent"
              ? `Observasi guru · ${name}`
              : user.role === "child"
                ? "Catatan dari guru"
                : `Observasi · ${name}`,
          body: obs.title,
          time: relativeTime(obs.observedAt),
          type: "observation",
          at: obs.observedAt.getTime(),
        });
      }
      for (const note of notes) {
        const name = childName(note.childId);
        items.push({
          id: `note-${note.id}`,
          title:
            user.role === "parent"
              ? `Catatan terapis · ${name}`
              : user.role === "child"
                ? "Catatan dari terapis"
                : `Catatan sesi · ${name}`,
          body: note.title,
          time: relativeTime(note.sessionAt),
          type: "session",
          at: note.sessionAt.getTime(),
        });
      }
      for (const act of activities) {
        const name = childName(act.childId);
        items.push({
          id: `act-${act.id}`,
          title:
            user.role === "child"
              ? "Aktivitas selesai"
              : user.role === "parent"
                ? `${name} menyelesaikan latihan`
                : `Aktivitas · ${name}`,
          body: act.title,
          time: relativeTime(act.completedAt),
          type: "activity",
          at: act.completedAt.getTime(),
        });
      }
    }

    items.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
    const trimmed = items.slice(0, 12).map(({ at, ...rest }) => ({
      ...rest,
      created_at: at ? new Date(at).toISOString() : null,
    }));
    // Unread is computed client-side after mark-as-read; server returns full list
    return {
      settings: toSnake(settings),
      items: trimmed,
      unread: trimmed.length,
      role: user.role,
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
    const kids = await childrenFor(user);
    if (user.role !== "parent") {
      return { children: toSnake(kids), teachers: [], therapists: [] };
    }
    const userIds = [
      ...new Set(
        kids.flatMap((k) => [k.userId, k.teacherId, k.therapistId].filter(Boolean) as string[]),
      ),
    ];
    const [profiles, staffRoles] = await Promise.all([
      userIds.length
        ? prisma.userProfile.findMany({ where: { userId: { in: userIds } } })
        : Promise.resolve([]),
      prisma.userRole.findMany({
        where: { role: { in: ["teacher", "therapist"] } },
        include: { profile: true },
      }),
    ]);
    const byUser = new Map(profiles.map((p) => [p.userId, p]));
    const staffMap = new Map<string, { email: string; fullName: string; role: string }>();
    for (const row of staffRoles) {
      if (!row.profile?.email) continue;
      staffMap.set(`${row.role}:${row.userId}`, {
        email: row.profile.email,
        fullName: row.profile.fullName || row.profile.email,
        role: row.role,
      });
    }
    const teachers = [...staffMap.values()]
      .filter((s) => s.role === "teacher")
      .map(({ email, fullName }) => ({ email, fullName }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    const therapists = [...staffMap.values()]
      .filter((s) => s.role === "therapist")
      .map(({ email, fullName }) => ({ email, fullName }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    return {
      children: toSnake(
        kids.map((k) => ({
          ...k,
          loginEmail: k.userId ? (byUser.get(k.userId)?.email ?? null) : null,
          teacherEmail: k.teacherId ? (byUser.get(k.teacherId)?.email ?? null) : null,
          teacherName: k.teacherId ? (byUser.get(k.teacherId)?.fullName ?? null) : null,
          therapistEmail: k.therapistId ? (byUser.get(k.therapistId)?.email ?? null) : null,
          therapistName: k.therapistId ? (byUser.get(k.therapistId)?.fullName ?? null) : null,
        })),
      ),
      teachers: toSnake(teachers),
      therapists: toSnake(therapists),
    };
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

            const teacherEmail = String(body.teacher_email ?? body.teacherEmail ?? "")
              .trim()
              .toLowerCase();
            const therapistEmail = String(body.therapist_email ?? body.therapistEmail ?? "")
              .trim()
              .toLowerCase();

            const linkOnCreate = async (
              memberEmail: string,
              memberRole: "teacher" | "therapist",
            ) => {
              if (!memberEmail) return;
              const member = await prisma.userProfile.findFirst({
                where: { email: memberEmail },
                include: { roles: true },
              });
              const roleLabel = memberRole === "teacher" ? "guru" : "terapis";
              if (!member || !member.roles.some((r) => r.role === memberRole)) {
                throw new Error(`Akun ${roleLabel} dengan email tersebut tidak ditemukan`);
              }
              await prisma.careTeamMember.create({
                data: {
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
            };

            try {
              if (teacherEmail) await linkOnCreate(teacherEmail, "teacher");
              if (therapistEmail) await linkOnCreate(therapistEmail, "therapist");
            } catch (err) {
              return json(
                {
                  saved: true,
                  child: toSnake(child),
                  login: { email, role: "child" },
                  warning:
                    err instanceof Error
                      ? err.message
                      : "Akun anak dibuat, tapi guru/terapis gagal dihubungkan",
                },
                200,
              );
            }

            const fresh = await prisma.childProfile.findUnique({ where: { id: child.id } });
            return json({
              saved: true,
              child: toSnake(fresh ?? child),
              login: { email, role: "child" },
            });
          }

          if (action === "update-child") {
            if (user.role !== "parent") {
              return json({ error: "Hanya orang tua yang bisa mengubah data anak" }, 403);
            }
            const childId = String(body.child_id ?? body.childId ?? "").trim();
            if (!childId) return json({ error: "ID anak wajib diisi" }, 400);
            const child = await prisma.childProfile.findFirst({
              where: { id: childId, parentId: user.userId },
            });
            if (!child) return json({ error: "Profil anak tidak ditemukan" }, 404);

            const name = String(body.name ?? "").trim();
            if (!name) return json({ error: "Nama anak wajib diisi" }, 400);
            const ageRaw = body.age;
            const age =
              ageRaw === undefined || ageRaw === null || ageRaw === ""
                ? null
                : Number(ageRaw);
            const diagnosisLevel =
              String(body.diagnosis_level ?? body.diagnosisLevel ?? "").trim() || null;
            const learningGoal =
              String(body.learning_goal ?? body.learningGoal ?? "").trim() || null;
            const newPassword = String(body.password ?? "").trim();
            const loginEmail = String(body.email ?? "").trim().toLowerCase();

            if (newPassword && newPassword.length < 8) {
              return json({ error: "Password baru minimal 8 karakter" }, 400);
            }

            if (child.userId && loginEmail) {
              const taken = await prisma.userProfile.findFirst({
                where: { email: loginEmail, NOT: { userId: child.userId } },
              });
              if (taken) {
                return json({ error: "Email sudah terpakai. Gunakan email lain." }, 409);
              }
            }

            const { hashPassword } = await import("@/lib/password");
            const updated = await prisma.$transaction(async (tx) => {
              const row = await tx.childProfile.update({
                where: { id: child.id },
                data: {
                  name,
                  age: Number.isFinite(age as number) ? (age as number) : null,
                  diagnosisLevel,
                  learningGoal,
                },
              });
              if (child.userId) {
                const profileData: { fullName: string; email?: string; passwordHash?: string } = {
                  fullName: name,
                };
                if (loginEmail) profileData.email = loginEmail;
                if (newPassword) profileData.passwordHash = await hashPassword(newPassword);
                await tx.userProfile.update({
                  where: { userId: child.userId },
                  data: profileData,
                });
              }
              return row;
            });

            const teacherEmail = String(body.teacher_email ?? body.teacherEmail ?? "").trim().toLowerCase();
            const therapistEmail = String(
              body.therapist_email ?? body.therapistEmail ?? "",
            )
              .trim()
              .toLowerCase();

            const linkMember = async (memberEmail: string, memberRole: "teacher" | "therapist") => {
              if (!memberEmail) return;
              const member = await prisma.userProfile.findFirst({
                where: { email: memberEmail },
                include: { roles: true },
              });
              const roleLabel = memberRole === "teacher" ? "guru" : "terapis";
              if (!member || !member.roles.some((r) => r.role === memberRole)) {
                throw new Error(`Akun ${roleLabel} dengan email tersebut tidak ditemukan`);
              }
              await prisma.careTeamMember.deleteMany({
                where: {
                  childId: child.id,
                  role: memberRole,
                  NOT: { userId: member.userId },
                },
              });
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
            };

            try {
              if (teacherEmail) await linkMember(teacherEmail, "teacher");
              if (therapistEmail) await linkMember(therapistEmail, "therapist");
            } catch (err) {
              return json(
                { error: err instanceof Error ? err.message : "Gagal menghubungkan tim" },
                404,
              );
            }

            const fresh = await prisma.childProfile.findUnique({ where: { id: child.id } });
            return json({ saved: true, child: toSnake(fresh ?? updated) });
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
              return json({ error: "Hanya orang tua yang bisa menghubungkan guru/terapis" }, 403);
            }
            const childId = String(body.child_id ?? body.childId ?? "");
            const memberEmail = String(body.email ?? "").trim().toLowerCase();
            const memberRole = String(body.role ?? "") as "teacher" | "therapist";
            if (!childId || !memberEmail || !["teacher", "therapist"].includes(memberRole)) {
              return json({ error: "Data anak, email, dan peran (guru/terapis) wajib diisi" }, 400);
            }
            const child = await prisma.childProfile.findFirst({
              where: { id: childId, parentId: user.userId },
            });
            if (!child) return json({ error: "Profil anak tidak ditemukan" }, 404);
            const member = await prisma.userProfile.findFirst({
              where: { email: memberEmail },
              include: { roles: true },
            });
            const roleLabel = memberRole === "teacher" ? "guru" : "terapis";
            if (!member || !member.roles.some((r) => r.role === memberRole)) {
              return json(
                { error: `Akun ${roleLabel} dengan email tersebut tidak ditemukan` },
                404,
              );
            }
            // Drop previous member of same role on this child
            await prisma.careTeamMember.deleteMany({
              where: {
                childId: child.id,
                role: memberRole,
                NOT: { userId: member.userId },
              },
            });
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
            return json({
              saved: true,
              member: {
                role: memberRole,
                email: member.email,
                name: member.fullName,
              },
            });
          }

          if (action === "unlink-care-team") {
            if (user.role !== "parent") {
              return json({ error: "Hanya orang tua yang bisa melepaskan guru/terapis" }, 403);
            }
            const childId = String(body.child_id ?? body.childId ?? "").trim();
            const memberRole = String(body.role ?? "") as "teacher" | "therapist";
            if (!childId || !["teacher", "therapist"].includes(memberRole)) {
              return json({ error: "Data anak dan peran (guru/terapis) wajib diisi" }, 400);
            }
            const child = await prisma.childProfile.findFirst({
              where: { id: childId, parentId: user.userId },
            });
            if (!child) return json({ error: "Profil anak tidak ditemukan" }, 404);
            await prisma.careTeamMember.deleteMany({
              where: { childId: child.id, role: memberRole },
            });
            await prisma.childProfile.update({
              where: { id: child.id },
              data:
                memberRole === "teacher" ? { teacherId: null } : { therapistId: null },
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
            const canManageRole =
              user.role === "teacher" || user.role === "therapist" || user.role === "admin";
            /** Sova (createdBy null) → admin only. Own → owner. Peers → no. Admin can manage all. */
            const canMutateResource = (existing: { createdBy: string | null }) => {
              if (!canManageRole) return false;
              const ownerId = existing.createdBy ?? null;
              if (!ownerId) return user.role === "admin";
              if (ownerId === user.userId) return true;
              if (user.role === "admin") return true;
              return false;
            };

            if (action === "delete-resource") {
              if (!canManageRole) return json({ error: "Tidak diizinkan menghapus materi" }, 403);
              const id = String(body.id ?? body.resource_id ?? "").trim();
              if (!id) return json({ error: "Materi tidak ditemukan" }, 400);
              const existing = await prisma.resource.findUnique({ where: { id } });
              if (!existing) return json({ error: "Materi tidak ditemukan" }, 404);
              if (!canMutateResource(existing)) {
                return json(
                  {
                    error: existing.createdBy
                      ? "Hanya pemilik materi yang boleh menghapus"
                      : "Materi Sova hanya bisa dihapus oleh admin",
                  },
                  403,
                );
              }
              await prisma.resource.update({
                where: { id },
                data: { isActive: false },
              });
              return json({ saved: true, deleted: true });
            }

            if (!canManageRole) {
              return json({ error: "Tidak diizinkan menambah atau mengubah materi" }, 403);
            }

            const title = String(body.title ?? "").trim();
            let description = String(body.description ?? "").trim();
            const bodyContent = String(body.body ?? body.content ?? "").trim() || null;
            // Card blurb only — keep short even if old clients send a long description
            if (description.length > 220) {
              description = `${description.slice(0, 217).trim()}…`;
            }
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
              if (!canMutateResource(existing)) {
                return json(
                  {
                    error: existing.createdBy
                      ? "Hanya pemilik materi yang boleh mengedit"
                      : "Materi Sova hanya bisa diedit oleh admin",
                  },
                  403,
                );
              }
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
                  body: bodyContent,
                  category,
                  url: nextUrl,
                  // keep Sova ownership null; never claim peer materials
                  createdBy: existing.createdBy,
                },
              });
              return json({ saved: true, resource: toSnake(updated) });
            }

            const created = await prisma.resource.create({
              data: {
                title,
                description,
                body: bodyContent,
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
            const { freePlayXp, journeyTitlesForScenario, scenarioForJourney } = await import(
              "@/lib/journey-map"
            );
            const scored = scoreSimulation({
              scenario: body.scenario,
              conversation: body.conversation ?? [],
              score: body.score,
              feedback: body.feedback,
            });
            const score = Number(body.score ?? scored.score);
            const scenarioTitle = String(body.scenario ?? "");
            await prisma.simulationSession.create({
              data: {
                childId: child.id,
                scenario: scenarioTitle,
                conversation: body.conversation,
                score,
                feedback: body.feedback ?? scored.feedback,
                strength: body.strength ?? scored.strength,
                suggestion: body.suggestion ?? scored.suggestion,
              },
            });

            // Resolve journey level: explicit id, or active level mapped to this scenario
            let journeyLevelId = String(body.journey_level_id ?? body.journeyLevelId ?? "").trim();
            let level =
              journeyLevelId
                ? await prisma.journeyLevel.findUnique({ where: { id: journeyLevelId } })
                : null;
            if (!level && score >= 60) {
              const titles = journeyTitlesForScenario(scenarioTitle);
              const allLevels = await prisma.journeyLevel.findMany({
                orderBy: { levelOrder: "asc" },
              });
              const candidates = allLevels.filter(
                (l) =>
                  titles.some((t) => t.toLowerCase() === l.title.toLowerCase()) ||
                  scenarioForJourney(l.title).toLowerCase() === scenarioTitle.toLowerCase(),
              );
              const rows = await prisma.userJourneyProgress.findMany({
                where: { childId: child.id },
              });
              const statusMap = new Map(rows.map((r) => [r.journeyLevelId, r.status]));
              level =
                candidates.find((l) => statusMap.get(l.id) === "in_progress") ??
                candidates.find((l) => statusMap.get(l.id) !== "completed") ??
                null;
              if (level) journeyLevelId = level.id;
            }

            // Single XP source: journey reward if linked, else free-play scaled XP
            let journeyCompleted: any = null;
            let xpGain = freePlayXp(Number(body.difficulty ?? 2));
            if (level && score >= 60) {
              const existing = await prisma.userJourneyProgress.findUnique({
                where: {
                  childId_journeyLevelId: { childId: child.id, journeyLevelId: level.id },
                },
              });
              if (existing?.status === "completed") {
                journeyCompleted = { level_id: level.id, already: true, title: level.title };
                xpGain = Math.round(freePlayXp(Number(body.difficulty ?? 2)) * 0.35);
              } else {
                xpGain = level.xpReward || 100;
                await prisma.userJourneyProgress.upsert({
                  where: {
                    childId_journeyLevelId: { childId: child.id, journeyLevelId: level.id },
                  },
                  update: { status: "completed", completedAt: new Date() },
                  create: {
                    childId: child.id,
                    journeyLevelId: level.id,
                    status: "completed",
                    completedAt: new Date(),
                  },
                });
                const next = await prisma.journeyLevel.findFirst({
                  where: { levelOrder: level.levelOrder + 1 },
                });
                if (next) {
                  await prisma.userJourneyProgress.upsert({
                    where: {
                      childId_journeyLevelId: { childId: child.id, journeyLevelId: next.id },
                    },
                    update: { status: "in_progress" },
                    create: {
                      childId: child.id,
                      journeyLevelId: next.id,
                      status: "in_progress",
                    },
                  });
                }
                journeyCompleted = {
                  level_id: level.id,
                  title: level.title,
                  xpGained: xpGain,
                  next_level_id: next?.id ?? null,
                };
              }
            }

            const reward = await awardProgress(child.id, {
              xp: xpGain,
              missionStep: true,
              title: journeyCompleted?.title
                ? `Journey: ${journeyCompleted.title}`
                : `Simulasi: ${scenarioTitle}`,
              category: journeyCompleted && !journeyCompleted.already ? "Journey" : "AI Simulation",
              score,
              detail: body.feedback ?? scored.feedback,
              skill: {
                communicationScore: score,
                conversationScore: score,
                greetingScore: score,
                confidenceScore: score,
              },
            });

            return json({
              saved: true,
              ...scored,
              score,
              xpGained: reward.xpGained,
              coins: reward.coins,
              leveledUp: reward.leveledUp,
              newBadges: reward.newBadges,
              progress: toSnake(reward.progress),
              journeyCompleted,
            });
          }

          if (action === "mission-step") {
            // Manual complete disabled — missions advance via real activities only
            return json(
              {
                error:
                  "Selesaikan misi lewat latihan: buka Simulasi, Perasaan, atau Cerita Sosial.",
              },
              400,
            );
          }

          if (action === "complete-journey") {
            if (user.role !== "child" && user.role !== "parent") {
              return json({ error: "Hanya akun anak (atau parent) yang bisa menyelesaikan level." }, 403);
            }
            const levelId = String(body.level_id ?? body.levelId ?? "").trim();
            if (!levelId) return json({ error: "level_id wajib" }, 400);
            const level = await prisma.journeyLevel.findUnique({ where: { id: levelId } });
            if (!level) return json({ error: "Level tidak ditemukan" }, 404);

            const existing = await prisma.userJourneyProgress.findUnique({
              where: {
                childId_journeyLevelId: { childId: child.id, journeyLevelId: level.id },
              },
            });
            if (existing?.status === "completed") {
              return json({ saved: true, already: true, message: "Level sudah selesai" });
            }

            await prisma.userJourneyProgress.upsert({
              where: {
                childId_journeyLevelId: { childId: child.id, journeyLevelId: level.id },
              },
              update: { status: "completed", completedAt: new Date() },
              create: {
                childId: child.id,
                journeyLevelId: level.id,
                status: "completed",
                completedAt: new Date(),
              },
            });

            // unlock next level
            const next = await prisma.journeyLevel.findFirst({
              where: { levelOrder: level.levelOrder + 1 },
            });
            if (next) {
              await prisma.userJourneyProgress.upsert({
                where: {
                  childId_journeyLevelId: { childId: child.id, journeyLevelId: next.id },
                },
                update: { status: "in_progress" },
                create: {
                  childId: child.id,
                  journeyLevelId: next.id,
                  status: "in_progress",
                },
              });
            }

            const reward = await awardProgress(child.id, {
              xp: level.xpReward || 100,
              missionStep: true,
              title: `Journey: ${level.title}`,
              category: "Journey",
              score: 95,
              detail: level.description,
              skill: { confidenceScore: 80, communicationScore: 75 },
            });
            return json({
              saved: true,
              xpGained: reward.xpGained,
              coins: reward.coins,
              leveledUp: reward.leveledUp,
              newBadges: reward.newBadges,
              progress: toSnake(reward.progress),
              next_level_id: next?.id ?? null,
            });
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
            const situation = String(body.situation ?? "");
            // Prevent XP farm: same situation already saved → no new XP
            const already = await prisma.socialStory.findFirst({
              where: { childId: child.id, situation },
              orderBy: { createdAt: "desc" },
            });
            if (already) {
              return json({
                saved: true,
                already: true,
                generatedStory: already.generatedStory,
                title: already.title,
                xpGained: 0,
                message: "Cerita ini sudah pernah dibaca. Coba cerita lain untuk XP.",
              });
            }
            await prisma.socialStory.create({
              data: {
                childId: child.id,
                title,
                situation,
                generatedStory: generated,
              },
            });
            const reward = await awardProgress(child.id, {
              xp: Number(body.xp ?? 40) || 40,
              missionStep: Boolean(body.mission_step ?? true),
              title: `Cerita Sosial: ${title}`,
              category: "Social Story",
              score: 88,
              detail: situation,
              skill: { empathyScore: 75, confidenceScore: 70 },
            });
            return json({
              saved: true,
              generatedStory: generated,
              title,
              xpGained: reward.xpGained,
              coins: reward.coins,
              leveledUp: reward.leveledUp,
              newBadges: reward.newBadges,
              progress: toSnake(reward.progress),
            });
          }

          if (action === "emotion") {
            const analyzed =
              body.detected_emotion && body.recommendation
                ? {
                    label: body.detected_emotion,
                    confidence: body.confidence,
                    rec: body.recommendation,
                    scores: body.scores,
                  }
                : analyzeEmotion(String(body.input_text ?? body.emotion_prompt ?? ""));
            const inputText = String(
              body.input_text ?? body.emotion_prompt ?? `Perasaan: ${analyzed.label}`,
            );
            await prisma.emotionAnalysis.create({
              data: {
                childId: child.id,
                inputText,
                detectedEmotion: analyzed.label,
                confidence: analyzed.confidence,
                recommendation: analyzed.rec,
              },
            });
            const reward = await awardProgress(child.id, {
              xp: Number(body.xp ?? 30) || 30,
              missionStep: Boolean(body.mission_step ?? true),
              title: `Mengenali Perasaan ${analyzed.label}`,
              category: "Emotion",
              score: analyzed.confidence,
              detail: inputText,
              skill: { empathyScore: analyzed.confidence, confidenceScore: 65 },
            });
            return json({
              saved: true,
              ...analyzed,
              xpGained: reward.xpGained,
              coins: reward.coins,
              leveledUp: reward.leveledUp,
              newBadges: reward.newBadges,
              progress: toSnake(reward.progress),
            });
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
