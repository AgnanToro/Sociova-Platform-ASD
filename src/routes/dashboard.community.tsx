import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/site/page-header";
import { useAuth } from "@/lib/auth";
import {
  createCommunityPost,
  createCommunityReply,
  likeCommunityPost,
  loadCommunityData,
  useSociovaQuery,
} from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/community")({
  component: CommunityPage,
});

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function roleLabel(role?: string) {
  return (
    {
      child: "Anak",
      parent: "Orang Tua",
      teacher: "Guru",
      therapist: "Terapis",
    } as Record<string, string>
  )[role ?? ""] ?? "Anggota";
}

function CommunityPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useSociovaQuery(loadCommunityData);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  const submitPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await createCommunityPost(content.trim());
      toast.success("Status dibagikan");
      setContent("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status gagal dibagikan");
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async (postId: string) => {
    const draft = (replyDrafts[postId] ?? "").trim();
    if (!draft) return;
    setReplyingId(postId);
    try {
      await createCommunityReply(postId, draft);
      toast.success("Balasan terkirim");
      setReplyDrafts((current) => ({ ...current, [postId]: "" }));
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Balasan gagal dikirim");
    } finally {
      setReplyingId(null);
    }
  };

  const submitLike = async (postId: string) => {
    setLikingId(postId);
    try {
      await likeCommunityPost(postId);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyukai status");
    } finally {
      setLikingId(null);
    }
  };

  if (loading) {
    return <StateCard title="Loading community" description="Memuat status terbaru komunitas." />;
  }
  if (error) return <StateCard title="Community unavailable" description={error} />;

  const posts = data?.posts ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Community"
        description="Ruang aman untuk berbagi status, saling balas, dan merayakan perkembangan kecil."
      />

      <Card className="rounded-2xl border-border/60 bg-card/60 p-4 backdrop-blur-sm">
        <form onSubmit={submitPost} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full btn-brand border-0 text-xs font-semibold">
            {initials(user?.fullName ?? "SV")}
          </div>
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Bagikan status atau cerita kecil hari ini..."
            className="h-11 rounded-full"
          />
          <Button disabled={posting || !content.trim()} className="rounded-full btn-brand border-0">
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </form>
      </Card>

      <div className="mt-4 space-y-4">
        {posts.length === 0 && (
          <Card className="rounded-2xl border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
            Belum ada status. Jadilah yang pertama berbagi.
          </Card>
        )}

        {posts.map((post: any) => (
          <Card
            key={post.id}
            className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full btn-brand border-0 text-xs font-semibold">
                {initials(post.author)}
              </div>
              <div>
                <div className="text-sm font-medium">{post.author}</div>
                <div className="text-xs text-muted-foreground">
                  {roleLabel(post.role)} · {post.time || "Baru saja"}
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed">{post.content}</p>

            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <button
                type="button"
                disabled={likingId === post.id}
                onClick={() => submitLike(post.id)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Heart className="h-3.5 w-3.5" /> {post.likes ?? 0}
              </button>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" /> {post.comments ?? post.replies?.length ?? 0}
              </span>
            </div>

            <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
              {(post.replies ?? []).map((reply: any) => (
                <div key={reply.id} className="rounded-xl bg-background/40 px-3 py-2">
                  <div className="text-xs font-medium">
                    {reply.author}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {roleLabel(reply.role)} · {reply.time || "Baru saja"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{reply.content}</p>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Input
                  value={replyDrafts[post.id] ?? ""}
                  onChange={(event) =>
                    setReplyDrafts((current) => ({
                      ...current,
                      [post.id]: event.target.value,
                    }))
                  }
                  placeholder="Tulis balasan..."
                  className="h-10 rounded-full"
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={replyingId === post.id || !(replyDrafts[post.id] ?? "").trim()}
                  onClick={() => submitReply(post.id)}
                  className="rounded-full btn-brand border-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
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
