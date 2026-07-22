import { useCallback, useEffect, useState, type DependencyList } from "react";
import { getToken } from "@/lib/auth";
import type { AppRole } from "@/lib/roles";
import {
  demoAchievements,
  demoCommunityPosts,
  demoEmotionLogs,
  demoJourneyLevels,
  demoProgress,
  demoResources,
  demoScenarios,
  demoStories,
} from "@/lib/demo-data";

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
      .then((result) => {
        if (mounted) setData(result);
      })
      .catch((reason) => {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : "Unable to load data");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: useCallback(() => setTick((value) => value + 1), []),
  };
}

async function api<T>(action: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Please sign in to load your Sociova data.");

  const response = await fetch(`/api/data/${action}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();
  let result: any = null;

  if (contentType.includes("application/json")) {
    try {
      result = raw ? JSON.parse(raw) : null;
    } catch {
      throw new Error("Respons server tidak valid.");
    }
  } else {
    throw new Error(
      response.ok
        ? "Respons server tidak valid."
        : `Server error (${response.status}). Coba refresh dan login ulang.`,
    );
  }

  if (!response.ok) {
    throw new Error(result?.error ?? `Unable to load data (${response.status})`);
  }

  return result as T;
}

export const loadDashboardData = () => api<any>("dashboard");
export const loadJourneyData = () =>
  api<any>("journey").catch(() => ({ demoMode: true, levels: demoJourneyLevels }));
export const loadSimulationData = () => api<any[]>("simulation").catch(() => demoScenarios);
export const loadStoryData = () =>
  api<any>("story").catch(() => ({ demoMode: true, stories: demoStories }));
export const loadEmotionData = () =>
  api<any>("emotion").catch(() => ({ demoMode: true, logs: demoEmotionLogs }));
export const loadAchievementsData = () =>
  api<any>("achievements").catch(() => ({
    demoMode: true,
    progress: demoProgress,
    achievements: demoAchievements,
  }));
export const loadCommunityData = () =>
  api<any>("community").catch(() => ({ demoMode: true, posts: demoCommunityPosts }));
export const loadResourcesData = () => api<any[]>("resources").catch(() => demoResources);
export const loadRoleDashboardData = (_role: "parent" | "teacher" | "therapist") =>
  api<any>("role");
export const loadRoleDetailData = () => api<any>("role-detail");
export const loadSettingsData = () => api<any>("settings");
export const saveSettingsData = (payload: any) =>
  api<{ saved: boolean }>("settings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const saveSimulationSession = (params: {
  scenario: string;
  conversation: Array<{ from: "ai" | "me"; text: string }>;
  score: number;
  feedback: string;
  strength: string;
  suggestion: string;
}) =>
  api<{ saved: boolean }>("simulation", {
    method: "POST",
    body: JSON.stringify(params),
  });
export const saveSocialStory = (situation: string, generatedStory: string) =>
  api<{ saved: boolean }>("story", {
    method: "POST",
    body: JSON.stringify({ situation, generatedStory }),
  });
export const saveEmotionAnalysis = (params: {
  input_text: string;
  detected_emotion: string;
  confidence: number;
  recommendation: string;
}) =>
  api<{ saved: boolean }>("emotion", {
    method: "POST",
    body: JSON.stringify(params),
  });
export const createCommunityPost = (content: string) =>
  api<{ saved: boolean }>("community", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
export const createCommunityReply = (postId: string, content: string) =>
  api<{ saved: boolean }>("community-reply", {
    method: "POST",
    body: JSON.stringify({ post_id: postId, content }),
  });
export const likeCommunityPost = (postId: string) =>
  api<{ saved: boolean }>("community-like", {
    method: "POST",
    body: JSON.stringify({ post_id: postId }),
  });

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export type { AppRole };
