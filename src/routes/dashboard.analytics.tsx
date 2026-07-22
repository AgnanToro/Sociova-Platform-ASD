import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/site/page-header";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { loadAnalyticsData, useSociovaQuery } from "@/lib/sociova-data";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { role } = useAuth();
  const { data, loading, error } = useSociovaQuery(loadAnalyticsData);

  if (loading) return <State title="Loading analytics" description="Memuat tren perkembangan dari MySQL." />;
  if (error) return <State title="Analytics unavailable" description={error} />;

  const radar = data?.radar?.length
    ? data.radar
    : [
        { skill: "Communication", value: 0 },
        { skill: "Confidence", value: 0 },
        { skill: "Empathy", value: 0 },
        { skill: "Greeting", value: 0 },
        { skill: "Listening", value: 0 },
        { skill: "Conversation", value: 0 },
      ];
  const weekly = data?.weekly?.length ? data.weekly : [{ d: "M", xp: 0 }];
  const monthly = data?.monthly?.length ? data.monthly : [{ m: "-", score: 0 }];
  const emotionTrends = data?.emotionTrends ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title={role === "teacher" ? "Class Analytics" : role === "parent" ? "Progress Analytics" : "Analytics"}
        description={
          data?.child?.name
            ? `Data perkembangan real untuk ${data.child.name}.`
            : "Track skill growth over time from Sociova database."
        }
        actions={
          <Button asChild className="rounded-full btn-brand border-0">
            <Link to="/dashboard/report">Buka Laporan Mingguan</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="mb-4 font-semibold">Skill radar</div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Radar dataKey="value" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="mb-4 font-semibold">Weekly XP / Activity</div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="d" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="xp" fill="var(--brand)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="mb-4 font-semibold">Score trend</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="m" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="score" stroke="var(--brand)" strokeWidth={3} dot={{ fill: "var(--brand)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {emotionTrends.length > 0 && (
          <Card className="lg:col-span-2 rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
            <div className="mb-4 font-semibold">Emotion distribution</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {emotionTrends.map((item: any) => (
                <div key={item.label} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                  <div className="mt-1 font-display text-2xl font-bold">{item.count}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function State({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-7xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
