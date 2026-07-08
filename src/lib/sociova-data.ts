import { useCallback, useEffect, useState, type DependencyList } from "react";
import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/lib/roles";
import {
  demoAchievements,
  demoChild,
  demoCommunityPosts,
  demoEmotionLogs,
  demoJourneyLevels,
  demoMissions,
  demoProfile,
  demoProgress,
  demoResources,
  demoScenarios,
  demoSimulationSessions,
  demoStories,
} from "@/lib/demo-data";

const db = supabase as any;

export type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSociovaQuery<T>(
  loader: () => Promise<T>,
  deps: DependencyList = [],
): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    loader()
      .then((value) => {
        if (mounted) setData(value);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load data");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const refetch = useCallback(() => setTick((value) => value + 1), []);
  return { data, loading, error, refetch };
}

async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

async function getProfile(userId: string) {
  const { data } = await db.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  return data ?? null;
}

async function getRole(userId: string): Promise<AppRole | null> {
  const { data } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.role as AppRole | undefined) ?? null;
}

async function getChildren() {
  const { data, error } = await db
    .from("children")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getProgress(childId: string) {
  const { data } = await db
    .from("learning_progress")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function initializeJourneyProgress(childId: string) {
  const { data: levels } = await db
    .from("journey_levels")
    .select("id, level_order")
    .order("level_order", { ascending: true });
  if (!levels?.length) return;
  await db.from("user_journey_progress").upsert(
    levels.map((level: any) => ({
      child_id: childId,
      journey_level_id: level.id,
      status: level.level_order === 1 ? "in_progress" : "locked",
    })),
    { onConflict: "child_id,journey_level_id", ignoreDuplicates: true },
  );
}

async function ensureChild() {
  const user = await getUser();
  if (!user) return null;
  const [profile, role] = await Promise.all([getProfile(user.id), getRole(user.id)]);
  const existing = await getChildren();
  if (existing.length) return existing[0];
  if (role !== "child" && role !== "parent") return null;

  const childName = role === "child" ? profile?.full_name || demoChild.name : demoChild.name;
  const { data, error } = await db
    .from("children")
    .insert({
      parent_id: user.id,
      user_id: role === "child" ? user.id : null,
      name: childName,
      age: 8,
      diagnosis_level: "ASD support profile",
      learning_goal: demoChild.learning_goal,
    })
    .select("*")
    .single();
  if (error) return null;
  await db
    .from("learning_progress")
    .insert({ child_id: data.id, weekly_goal: 6, total_missions: 6 });
  await initializeJourneyProgress(data.id);
  return data;
}

function missionProgress(progress: any, target: number) {
  const done = Math.min(progress?.completed_missions ?? 0, target || 1);
  return { done, total: target || 1, value: Math.round((done / (target || 1)) * 100) };
}

export async function loadDashboardData() {
  const user = await getUser();
  if (!user) {
    return {
      demoMode: true,
      profile: demoProfile,
      child: demoChild,
      progress: demoProgress,
      dailyMission: demoMissions.daily,
      weeklyMission: demoMissions.weekly,
      recentSessions: demoSimulationSessions,
      recentStories: demoStories,
      latestEmotion: demoEmotionLogs[0],
      missionProgress: { done: 2, total: 4, value: 50 },
    };
  }

  const profile = (await getProfile(user.id)) ?? {
    ...demoProfile,
    full_name: user.email?.split("@")[0] ?? demoProfile.full_name,
    email: user.email,
  };
  const child = (await ensureChild()) ?? demoChild;
  const progress =
    child.id === demoChild.id ? demoProgress : ((await getProgress(child.id)) ?? demoProgress);
  const { data: missions } = await db
    .from("missions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  const dailyMission =
    missions?.find((mission: any) => mission.mission_type === "daily") ?? demoMissions.daily;
  const weeklyMission =
    missions?.find((mission: any) => mission.mission_type === "weekly") ?? demoMissions.weekly;
  const [{ data: recentSessions }, { data: recentStories }, { data: latestEmotion }] =
    await Promise.all([
      db
        .from("simulation_sessions")
        .select("scenario, score, created_at")
        .eq("child_id", child.id)
        .order("created_at", { ascending: false })
        .limit(3),
      db
        .from("social_stories")
        .select("title, created_at")
        .eq("child_id", child.id)
        .order("created_at", { ascending: false })
        .limit(3),
      db
        .from("emotion_analyses")
        .select("detected_emotion, confidence, created_at, input_text")
        .eq("child_id", child.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return {
    demoMode: child.id === demoChild.id,
    profile,
    child,
    progress,
    dailyMission,
    weeklyMission,
    recentSessions: recentSessions?.length ? recentSessions : demoSimulationSessions,
    recentStories: recentStories?.length ? recentStories : demoStories,
    latestEmotion: latestEmotion ?? demoEmotionLogs[0],
    missionProgress: missionProgress(progress, dailyMission.target_count),
  };
}

export async function loadJourneyData() {
  const child = await ensureChild();
  const { data: levels, error } = await db
    .from("journey_levels")
    .select("*")
    .order("level_order", { ascending: true });
  if (error) throw error;
  if (!levels?.length) return { demoMode: true, levels: demoJourneyLevels };

  if (!child)
    return {
      demoMode: true,
      levels: levels.map((level: any, index: number) => ({
        ...level,
        status: demoJourneyLevels[index]?.status ?? "locked",
      })),
    };

  await initializeJourneyProgress(child.id);
  const { data: progressRows } = await db
    .from("user_journey_progress")
    .select("journey_level_id, status")
    .eq("child_id", child.id);
  const statusByLevel = new Map(
    (progressRows ?? []).map((row: any) => [row.journey_level_id, row.status]),
  );
  return {
    demoMode: false,
    levels: levels.map((level: any) => ({
      ...level,
      status: statusByLevel.get(level.id) ?? "locked",
    })),
  };
}

export async function loadSimulationData() {
  const { data, error } = await db
    .from("simulation_scenarios")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data?.length ? data : demoScenarios;
}

export async function saveSimulationSession(params: {
  scenario: string;
  conversation: Array<{ from: "ai" | "me"; text: string }>;
  score: number;
  feedback: string;
  strength: string;
  suggestion: string;
}) {
  const child = await ensureChild();
  if (!child) return { saved: false };
  const { error } = await db.from("simulation_sessions").insert({ child_id: child.id, ...params });
  if (error) throw error;
  const progress = await getProgress(child.id);
  if (progress) {
    await db
      .from("learning_progress")
      .update({
        xp: (progress.xp ?? 0) + 80,
        completed_missions: Math.min(
          (progress.completed_missions ?? 0) + 1,
          progress.total_missions || 6,
        ),
        communication_score: Math.max(progress.communication_score ?? 0, params.score),
      })
      .eq("id", progress.id);
  }
  const { data: existingBadge } = await db
    .from("achievements")
    .select("id")
    .eq("child_id", child.id)
    .eq("name", "First Hello")
    .maybeSingle();
  if (!existingBadge && params.score >= 80) {
    await db
      .from("achievements")
      .insert({
        child_id: child.id,
        name: "First Hello",
        description: "Berhasil menyelesaikan latihan menyapa pertama.",
      });
  }
  return { saved: true };
}

export async function loadStoryData() {
  const child = await ensureChild();
  if (!child) return { demoMode: true, stories: demoStories };
  const { data, error } = await db
    .from("social_stories")
    .select("title, situation, generated_story, created_at")
    .eq("child_id", child.id)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return { demoMode: !data?.length, stories: data?.length ? data : demoStories };
}

export async function saveSocialStory(situation: string, generatedStory: string) {
  const child = await ensureChild();
  if (!child) return { saved: false };
  const title = situation.length > 42 ? `${situation.slice(0, 42)}…` : situation;
  const { error } = await db
    .from("social_stories")
    .insert({ child_id: child.id, title, situation, generated_story: generatedStory });
  if (error) throw error;
  return { saved: true };
}

export async function loadEmotionData() {
  const child = await ensureChild();
  if (!child) return { demoMode: true, logs: demoEmotionLogs };
  const { data, error } = await db
    .from("emotion_analyses")
    .select("input_text, detected_emotion, confidence, recommendation, created_at")
    .eq("child_id", child.id)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return { demoMode: !data?.length, logs: data?.length ? data : demoEmotionLogs };
}

export async function saveEmotionAnalysis(params: {
  input_text: string;
  detected_emotion: string;
  confidence: number;
  recommendation: string;
}) {
  const child = await ensureChild();
  if (!child) return { saved: false };
  const { error } = await db.from("emotion_analyses").insert({ child_id: child.id, ...params });
  if (error) throw error;
  return { saved: true };
}

export async function loadAchievementsData() {
  const child = await ensureChild();
  if (!child) return { demoMode: true, progress: demoProgress, achievements: demoAchievements };
  const [progress, { data: earnedRows }] = await Promise.all([
    getProgress(child.id),
    db.from("achievements").select("name, description, unlocked_at").eq("child_id", child.id),
  ]);
  const earned = new Set((earnedRows ?? []).map((row: any) => row.name));
  const safeProgress = progress ?? demoProgress;
  const achievements = demoAchievements.map((badge) => ({
    ...badge,
    earned:
      earned.has(badge.name) ||
      (badge.name === "7-Day Streak" && (safeProgress.streak ?? 0) >= 7) ||
      (badge.name === "Emotion Explorer" && (safeProgress.empathy_score ?? 0) >= 70),
  }));
  return { demoMode: !earnedRows?.length, progress: safeProgress, achievements };
}

export async function loadCommunityData() {
  const { data, error } = await db
    .from("community_posts")
    .select("id, role, content, likes, comments, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  const posts = (data ?? []).map((post: any) => ({
    ...post,
    author:
      post.role === "teacher"
        ? "Teacher member"
        : post.role === "therapist"
          ? "Therapist member"
          : post.role === "child"
            ? "Sociova learner"
            : "Parent member",
    time: relativeTime(post.created_at),
  }));
  return { demoMode: !posts.length, posts: posts.length ? posts : demoCommunityPosts };
}

export async function createCommunityPost(content: string) {
  const user = await getUser();
  if (!user) return { saved: false };
  const role = await getRole(user.id);
  const { error } = await db.from("community_posts").insert({ author_id: user.id, role, content });
  if (error) throw error;
  return { saved: true };
}

export async function loadResourcesData() {
  const { data, error } = await db
    .from("resources")
    .select("title, description, category, url, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data?.length
    ? data.map((item: any) => ({
        ...item,
        time: item.category === "Worksheet" ? "PDF" : "5 min read",
      }))
    : demoResources;
}

export async function loadRoleDashboardData(roleName: "parent" | "teacher" | "therapist") {
  const children = await getChildren();
  if (!children.length) {
    return {
      demoMode: true,
      children: [demoChild],
      progressByChild: { [demoChild.id]: demoProgress },
    };
  }
  const childIds = children.map((child: any) => child.id);
  const { data: progressRows } = await db
    .from("learning_progress")
    .select("*")
    .in("child_id", childIds);
  const progressByChild = Object.fromEntries(
    (progressRows ?? []).map((row: any) => [row.child_id, row]),
  );
  return {
    demoMode:
      roleName !== "parent" &&
      children.every((child: any) =>
        roleName === "teacher" ? !child.teacher_id : !child.therapist_id,
      ),
    children,
    progressByChild,
  };
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diff / 3600000));
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(value),
  );
}
