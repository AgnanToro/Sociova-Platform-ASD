import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/site/page-header";
import { MessageSquarePlus, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createCommunityPost, loadCommunityData, useSociovaQuery } from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/community")({ component: CommunityPage });

function CommunityPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadCommunityData);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const result = await createCommunityPost(content.trim());
      if (!result.saved) toast.error("Please sign in to post");
      else {
        toast.success("Post shared");
        setContent("");
        refetch();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not share post");
    } finally {
      setPosting(false);
    }
  };

  if (loading)
    return (
      <StateCard title="Loading community" description="Sova sedang memuat cerita komunitas." />
    );
  if (error) return <StateCard title="Community unavailable" description={error} />;
  const posts = data?.posts ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Community"
        description="Ruang aman untuk berbagi cerita, bertanya, dan merayakan perkembangan kecil."
      />
      {data?.demoMode && (
        <Card className="mb-4 rounded-2xl border-border/60 bg-card/60 p-4 text-sm text-muted-foreground backdrop-blur-sm">
          No community posts yet. Demo data is shown for preview.
        </Card>
      )}
      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-sm">
        <form onSubmit={submit} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full btn-brand border-0 text-xs font-semibold">
              AZ
            </div>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bagikan cerita kecil hari ini…"
              className="rounded-full h-11"
            />
            <Button disabled={posting} className="rounded-full btn-brand border-0">
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
      <div className="mt-4 space-y-4">
        {posts.map((p: any) => (
          <Card
            key={p.author}
            className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full btn-brand border-0 text-xs font-semibold">
                {p.author.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{p.author}</div>
                <div className="text-xs text-muted-foreground">
                  {p.role} · {p.time}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm">{p.content}</p>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <button className="inline-flex items-center gap-1 hover:text-foreground">
                <Heart className="h-3.5 w-3.5" /> {p.likes}
              </button>
              <button className="inline-flex items-center gap-1 hover:text-foreground">
                <MessageCircle className="h-3.5 w-3.5" /> {p.comments}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-4xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
