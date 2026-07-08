import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, PlayCircle, FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import { loadResourcesData, useSociovaQuery } from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/resources")({ component: ResourcesPage });

const resourceIcons = {
  Guide: BookOpen,
  Video: PlayCircle,
  Worksheet: FileText,
  Exercise: PlayCircle,
  Checklist: FileText,
} as const;

function ResourcesPage() {
  const { data: items, loading, error } = useSociovaQuery(loadResourcesData);
  if (loading)
    return (
      <StateCard
        title="Loading resources"
        description="Sova sedang memuat panduan dan worksheet."
      />
    );
  if (error) return <StateCard title="Resources unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Resources"
        description="Panduan, video, dan worksheet untuk orang tua, guru, dan pendamping."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((r: any) => {
          const Icon = resourceIcons[r.category as keyof typeof resourceIcons] ?? BookOpen;
          return (
            <Card
              key={r.title}
              className="group rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand)]/40"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
                  <Icon className="h-4 w-4" />
                </span>
                {r.category} · {r.time}
              </div>
              <div className="mt-3 font-semibold">{r.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              <Button variant="outline" className="mt-4 rounded-full">
                <Download className="mr-2 h-4 w-4" /> Open
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-7xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
