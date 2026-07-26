import { useCallback, useEffect, useState, type DependencyList } from "react";
import { getToken } from "@/lib/auth";
import type { AuthRole } from "@/lib/roles";

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
        if (mounted) setError(reason instanceof Error ? reason.message : "Unable to load data");
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
  if (!response.ok) throw new Error(result?.error ?? `Unable to load data (${response.status})`);
  return result as T;
}

export const loadDashboardData = () => api<any>("dashboard");
export const loadJourneyData = () => api<any>("journey");
export const loadSimulationData = () => api<any[]>("simulation");
export const loadStoryData = () => api<any>("story");
export const loadEmotionData = () => api<any>("emotion");
export const loadAchievementsData = () => api<any>("achievements");
export const loadCommunityData = () => api<any>("community");
export const loadResourcesData = () => api<any[]>("resources");
export const loadRoleDashboardData = (_role: "parent" | "teacher" | "therapist") =>
  api<any>("role");
export const loadRoleDetailData = (childId?: string) =>
  api<any>(`role-detail${childId ? `?child_id=${encodeURIComponent(childId)}` : ""}`);
export const loadAnalyticsData = (childId?: string) =>
  api<any>(`analytics${childId ? `?child_id=${encodeURIComponent(childId)}` : ""}`);
export const loadSettingsData = () => api<any>("settings");
export const loadWeeklyReport = (childId?: string) =>
  api<any>(`report${childId ? `?child_id=${encodeURIComponent(childId)}` : ""}`);
export const loadNotificationsData = () => api<any>("notifications");
export const loadChildrenData = () =>
  api<{
    children: any[];
    teachers?: { email: string; full_name: string }[];
    therapists?: { email: string; full_name: string }[];
  }>("children");
export const loadAdminStats = () => api<any>("admin-stats");
export const loadAdminUsers = () => api<{ users: any[] }>("admin-users");
export const adminSetRole = (payload: { user_id: string; role: string }) =>
  api<{ saved: boolean }>("admin-set-role", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const adminUpdateUser = (payload: {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  new_password?: string;
}) =>
  api<{ saved: boolean }>("admin-update-user", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const adminCreateUser = (payload: {
  full_name: string;
  email: string;
  password: string;
  role: string;
}) =>
  api<{ saved: boolean; user_id?: string }>("admin-create-user", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const adminDeletePost = (postId: string) =>
  api<{ saved: boolean }>("admin-delete-post", {
    method: "POST",
    body: JSON.stringify({ post_id: postId }),
  });
export const adminDeleteReply = (replyId: string) =>
  api<{ saved: boolean }>("admin-delete-reply", {
    method: "POST",
    body: JSON.stringify({ reply_id: replyId }),
  });
export const adminDeleteUser = (userId: string) =>
  api<{ saved: boolean }>("admin-delete-user", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
export const createChildProfile = (payload: {
  name: string;
  email: string;
  password: string;
  age?: number;
  diagnosis_level?: string;
  learning_goal?: string;
  teacher_email?: string;
  therapist_email?: string;
}) =>
  api<{ saved: boolean; child: any; login?: { email: string; role: string } }>("create-child", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateChildProfile = (payload: {
  child_id: string;
  name: string;
  email?: string;
  password?: string;
  age?: number;
  diagnosis_level?: string;
  learning_goal?: string;
  teacher_email?: string;
  therapist_email?: string;
}) =>
  api<{ saved: boolean; child: any }>("update-child", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const deleteChildProfile = (childId: string) =>
  api<{ saved: boolean; deleted?: boolean }>("delete-child", {
    method: "POST",
    body: JSON.stringify({ child_id: childId }),
  });
export const linkCareTeam = (payload: {
  child_id: string;
  email: string;
  role: "teacher" | "therapist";
}) =>
  api<{ saved: boolean; member?: { role: string; email: string; name: string } }>(
    "link-care-team",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
export const unlinkCareTeam = (payload: {
  child_id: string;
  role: "teacher" | "therapist";
}) =>
  api<{ saved: boolean }>("unlink-care-team", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const saveSettingsData = (payload: any) =>
  api<{ saved: boolean }>("settings", { method: "POST", body: JSON.stringify(payload) });
export const changePassword = (payload: {
  current_password: string;
  new_password: string;
}) =>
  api<{ saved: boolean }>("change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const verifyCurrentPassword = (current_password: string) =>
  api<{ ok: boolean }>("verify-password", {
    method: "POST",
    body: JSON.stringify({ current_password }),
  });
export const saveSimulationSession = (params: any) =>
  api<any>("simulation", { method: "POST", body: JSON.stringify(params) });
export const simulateTurn = (params: any) =>
  api<any>("simulate-turn", { method: "POST", body: JSON.stringify(params) });
export const saveSocialStory = (
  situation: string,
  generatedStory?: string,
  title?: string,
) =>
  api<any>("story", {
    method: "POST",
    body: JSON.stringify({ situation, generatedStory, title }),
  });
export const generateStory = (situation: string) =>
  api<any>("generate-story", { method: "POST", body: JSON.stringify({ situation }) });
export const saveEmotionAnalysis = (params: any) =>
  api<any>("emotion", { method: "POST", body: JSON.stringify(params) });
export const analyzeEmotionRequest = (input_text: string) =>
  api<any>("analyze-emotion", { method: "POST", body: JSON.stringify({ input_text }) });
export const completeMissionStep = (params: {
  step_id: string;
  title?: string;
  xp?: number;
}) =>
  api<any>("mission-step", { method: "POST", body: JSON.stringify(params) });
export const completeJourneyLevel = (params: { level_id: string }) =>
  api<any>("complete-journey", { method: "POST", body: JSON.stringify(params) });
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
  api<{ saved: boolean; already_liked?: boolean }>("community-like", {
    method: "POST",
    body: JSON.stringify({ post_id: postId }),
  });
export const createObservation = (payload: {
  title: string;
  observation: string;
  support_plan?: string;
  child_id?: string;
}) => api<{ saved: boolean }>("observation", { method: "POST", body: JSON.stringify(payload) });
export const createSessionNote = (payload: {
  title: string;
  note: string;
  next_focus?: string;
  child_id?: string;
}) => api<{ saved: boolean }>("session-note", { method: "POST", body: JSON.stringify(payload) });
export const createRecommendation = (payload: {
  title: string;
  description: string;
  audience?: string;
  category?: string;
  child_id?: string;
}) =>
  api<{ saved: boolean }>("recommendation", { method: "POST", body: JSON.stringify(payload) });

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(value),
  );
}

export type { AuthRole };

export const createResource = (payload: {
  title: string;
  description: string;
  body?: string;
  category?: string;
  url?: string;
  language?: string;
  media_data_url?: string;
  lesson?: string;
}) => api<{ saved: boolean }>("resource", { method: "POST", body: JSON.stringify(payload) });

export const updateResource = (payload: {
  id: string;
  title: string;
  description: string;
  body?: string;
  category?: string;
  media_data_url?: string;
  lesson?: string;
}) =>
  api<{ saved: boolean }>("update-resource", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const deleteResource = (id: string) =>
  api<{ saved: boolean }>("delete-resource", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
