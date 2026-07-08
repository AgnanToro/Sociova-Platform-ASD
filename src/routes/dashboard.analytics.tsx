import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/dashboard/analytics")({ component: AnalyticsPage });

const radar = [
  { skill: "Communication", value: 78 },
  { skill: "Confidence", value: 62 },
  { skill: "Empathy", value: 84 },
  { skill: "Greeting", value: 90 },
  { skill: "Listening", value: 70 },
  { skill: "Conversation", value: 66 },
];

const weekly = [
  { d: "Mon", xp: 30 },
  { d: "Tue", xp: 42 },
  { d: "Wed", xp: 38 },
  { d: "Thu", xp: 55 },
  { d: "Fri", xp: 48 },
  { d: "Sat", xp: 66 },
  { d: "Sun", xp: 78 },
];

const monthly = Array.from({ length: 12 }).map((_, i) => ({
  m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i],
  score: 40 + Math.round(Math.sin(i / 2) * 15 + i * 2),
}));

function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Track skill growth over time — across every dimension."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="mb-4 font-semibold">Skill radar</div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <Radar
                  dataKey="value"
                  stroke="var(--brand)"
                  fill="var(--brand)"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="mb-4 font-semibold">Weekly XP</div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="d" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="xp" fill="var(--brand)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="mb-4 font-semibold">Monthly score trend</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="m" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--brand)"
                  strokeWidth={3}
                  dot={{ fill: "var(--brand)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
