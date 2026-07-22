import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const demoChild = { id: "demo-child", name: "Bimo Pratama", age: 8, diagnosis_level: "ASD Level 1", learning_goal: "Berani menyapa teman dan menyampaikan kebutuhan dengan kalimat sederhana." };
const toSnake = (value: any): any => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toSnake);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), toSnake(item)]));
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "development-only-secret-change-me");

async function currentUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: String(payload.userId), role: String(payload.role), email: String(payload.email ?? "") };
  } catch { return null; }
}

async function childFor(user: { userId: string; role: string }) {
  const where = user.role === "child" ? { userId: user.userId } : user.role === "parent" ? { parentId: user.userId } : user.role === "teacher" ? { teacherId: user.userId } : { therapistId: user.userId };
  return prisma.childProfile.findFirst({ where, orderBy: { createdAt: "asc" } });
}

async function roleDashboard(user: { userId: string; role: string }) {
  const field = user.role === "parent" ? "parentId" : user.role === "teacher" ? "teacherId" : "therapistId";
  const children = await prisma.childProfile.findMany({ where: { [field]: user.userId }, orderBy: { name: "asc" } });
  const progress = await prisma.learningProgress.findMany({ where: { childId: { in: children.map((child) => child.id) } } });
  return { demoMode: false, children: toSnake(children), progressByChild: Object.fromEntries(progress.map((item) => [item.childId, toSnake(item)])) };
}

async function getData(action: string, user: { userId: string; role: string }) {
  if (action === "dashboard") {
    const child = await childFor(user);
    if (!child) return { demoMode: true, profile: { full_name: user.email.split("@")[0] }, child: demoChild, progress: { xp: 1240, level: 5, streak: 6, completed_missions: 4, total_missions: 6, weekly_goal: 6 }, dailyMission: null, weeklyMission: null, recentSessions: [], recentStories: [], latestEmotion: null, missionProgress: { done: 4, total: 6, value: 67 } };
    const [profile, progress, missions, sessions, stories, emotion, activity, recommendations] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: user.userId } }), prisma.learningProgress.findFirst({ where: { childId: child.id } }), prisma.mission.findMany({ where: { isActive: true } }), prisma.simulationSession.findMany({ where: { childId: child.id }, orderBy: { createdAt: "desc" }, take: 3 }), prisma.socialStory.findMany({ where: { childId: child.id }, orderBy: { createdAt: "desc" }, take: 3 }), prisma.emotionAnalysis.findFirst({ where: { childId: child.id }, orderBy: { createdAt: "desc" } }), prisma.activityHistory.findMany({ where: { childId: child.id }, orderBy: { completedAt: "desc" }, take: 5 }), prisma.recommendation.findMany({ where: { childId: child.id, audience: user.role as any }, orderBy: { createdAt: "desc" }, take: 3 }),
    ]);
    const dailyMission = missions.find((mission) => mission.missionType === "daily") ?? null;
    return { demoMode: false, profile: toSnake(profile), child: toSnake(child), progress: toSnake(progress), dailyMission: toSnake(dailyMission), weeklyMission: toSnake(missions.find((mission) => mission.missionType === "weekly") ?? null), recentSessions: toSnake(sessions), recentStories: toSnake(stories), latestEmotion: toSnake(emotion), recentActivity: toSnake(activity), recommendations: toSnake(recommendations), missionProgress: { done: progress?.completedMissions ?? 0, total: progress?.totalMissions || 1, value: Math.round(((progress?.completedMissions ?? 0) / (progress?.totalMissions || 1)) * 100) } };
  }
  if (action === "journey") { const child = await childFor(user); const levels = await prisma.journeyLevel.findMany({ orderBy: { levelOrder: "asc" } }); const rows = child ? await prisma.userJourneyProgress.findMany({ where: { childId: child.id } }) : []; const statuses = new Map(rows.map((row) => [row.journeyLevelId, row.status])); return { demoMode: !child, levels: toSnake(levels.map((level) => ({ ...level, status: statuses.get(level.id) ?? "locked" }))) }; }
  if (action === "simulation") return toSnake(await prisma.simulationScenario.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }));
  if (action === "story" || action === "emotion" || action === "achievements") { const child = await childFor(user); if (!child) return action === "achievements" ? { demoMode: true, progress: null, achievements: [] } : { demoMode: true, [action === "story" ? "stories" : "logs"]: [] }; if (action === "story") return { demoMode: false, stories: toSnake(await prisma.socialStory.findMany({ where: { childId: child.id }, orderBy: { createdAt: "desc" }, take: 5 })) }; if (action === "emotion") return { demoMode: false, logs: toSnake(await prisma.emotionAnalysis.findMany({ where: { childId: child.id }, orderBy: { createdAt: "desc" }, take: 5 })) }; const [progress, earned] = await Promise.all([prisma.learningProgress.findFirst({ where: { childId: child.id } }), prisma.achievement.findMany({ where: { childId: child.id } })]); return { demoMode: false, progress: toSnake(progress), achievements: toSnake(earned.map((badge) => ({ ...badge, earned: true }))) }; }
  if (action === "community") { const posts = await prisma.communityPost.findMany({ orderBy: { createdAt: "desc" }, take: 20 }); return { demoMode: false, posts: toSnake(posts.map((post) => ({ ...post, author: `${post.role ?? "Community"} member`, time: "Baru saja" }))) }; }
  if (action === "resources") return toSnake((await prisma.resource.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } })).map((item) => ({ ...item, time: item.category === "Worksheet" ? "PDF" : "5 min read" })));
  if (action === "settings") {
    const [profile, settings] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: user.userId } }),
      prisma.userSettings.findUnique({ where: { userId: user.userId } }),
    ]);
    return toSnake({ profile, settings, role: user.role });
  }
  if (action === "role") return roleDashboard(user);
  if (action === "role-detail") { const child = await childFor(user); if (!child) return {}; const [weekly, observations, notes, recommendations, activities] = await Promise.all([prisma.weeklyProgress.findMany({ where: { childId: child.id }, orderBy: { weekStart: "asc" } }), prisma.teacherObservation.findMany({ where: { childId: child.id }, orderBy: { observedAt: "desc" } }), prisma.therapistNote.findMany({ where: { childId: child.id }, orderBy: { sessionAt: "desc" } }), prisma.recommendation.findMany({ where: { childId: child.id }, orderBy: { createdAt: "desc" } }), prisma.activityHistory.findMany({ where: { childId: child.id }, orderBy: { completedAt: "desc" } })]); return toSnake({ child, weekly, observations, notes, recommendations, activities }); }
  throw new Error("Unknown data action");
}

export const Route = createFileRoute("/api/data/$action")({
  server: { handlers: {
    GET: async ({ request, params }) => { const user = await currentUser(request); return user ? json(await getData(params.action, user)) : json({ error: "Unauthorized" }, 401); },
    POST: async ({ request, params }) => { const user = await currentUser(request); if (!user) return json({ error: "Unauthorized" }, 401); const body = await request.json(); const child = await childFor(user); if (!child) return json({ saved: false }, 404); if (params.action === "simulation") { await prisma.simulationSession.create({ data: { childId: child.id, scenario: body.scenario, conversation: body.conversation, score: body.score, feedback: body.feedback, strength: body.strength, suggestion: body.suggestion } }); await prisma.activityHistory.create({ data: { childId: child.id, title: `Simulasi: ${body.scenario}`, category: "AI Simulation", score: body.score, detail: body.feedback } }); return json({ saved: true }); } if (params.action === "story") { const title = body.situation.length > 42 ? `${body.situation.slice(0, 42)}...` : body.situation; await prisma.socialStory.create({ data: { childId: child.id, title, situation: body.situation, generatedStory: body.generatedStory } }); return json({ saved: true }); } if (params.action === "emotion") { await prisma.emotionAnalysis.create({ data: { childId: child.id, inputText: body.input_text, detectedEmotion: body.detected_emotion, confidence: body.confidence, recommendation: body.recommendation } }); return json({ saved: true }); } if (params.action === "community") { await prisma.communityPost.create({ data: { authorId: user.userId, role: user.role as any, content: body.content } }); return json({ saved: true }); }
      if (params.action === "settings") {
        await prisma.$transaction([
          prisma.userProfile.update({ where: { userId: user.userId }, data: { fullName: body.full_name, languageMode: body.language_mode } }),
          prisma.userSettings.upsert({ where: { userId: user.userId }, update: body.settings, create: { userId: user.userId, ...body.settings } }),
        ]);
        return json({ saved: true });
      }
      return json({ error: "Unsupported action" }, 400); },
  } },
});
