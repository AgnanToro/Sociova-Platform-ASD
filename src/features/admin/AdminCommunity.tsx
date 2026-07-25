import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import {
  adminDeletePost,
  adminDeleteReply,
  loadCommunityData,
  useSociovaQuery,
} from "@/lib/sociova-data";
import { ROLE_LABELS, type AuthRole } from "@/lib/roles";

export function AdminCommunity() {
  const { data, loading, error, refetch } = useSociovaQuery(loadCommunityData);

  const onDeletePost = async (postId: string) => {
    if (!window.confirm("Hapus unggahan ini beserta semua balasannya?")) return;
    try {
      await adminDeletePost(postId);
      toast.success("Unggahan dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tidak bisa menghapus");
    }
  };

  const onDeleteReply = async (replyId: string) => {
    if (!window.confirm("Hapus balasan ini?")) return;
    try {
      await adminDeleteReply(replyId);
      toast.success("Balasan dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tidak bisa menghapus balasan");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="rounded-2xl p-6">
          <div className="font-display text-lg font-bold">Memuat komunitas…</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="rounded-2xl p-6">
          <div className="font-display text-lg font-bold">Belum bisa dimuat</div>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  const posts = data?.posts ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Komunitas"
        description="Pantau unggahan dan balasan. Hapus yang tidak pantas."
      />

      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card className="rounded-2xl border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
            Belum ada unggahan.
          </Card>
        ) : (
          posts.map((post: any) => (
            <Card key={post.id} className="rounded-2xl border-border/60 bg-card/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{post.author}</div>
                  <div className="text-xs text-muted-foreground">
                    {ROLE_LABELS[(post.role as AuthRole) ?? "parent"] ?? post.role} · {post.time}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{post.content}</p>

                  {(post.replies ?? []).length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-border/50 pt-3">
                      <div className="text-xs font-medium text-muted-foreground">
                        Balasan ({post.replies.length})
                      </div>
                      {post.replies.map((reply: any) => (
                        <div
                          key={reply.id}
                          className="flex items-start justify-between gap-2 rounded-xl border border-border/40 bg-background/30 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{reply.author}</span>
                              {" · "}
                              {ROLE_LABELS[(reply.role as AuthRole) ?? "parent"] ?? reply.role}
                              {" · "}
                              {reply.time}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{reply.content}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 rounded-lg px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onDeleteReply(reply.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDeletePost(post.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Hapus
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
