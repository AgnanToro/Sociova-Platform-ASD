import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  PlayCircle,
  FileText,
  Plus,
  X,
  Eye,
  Upload,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/page-header";
import {
  createResource,
  deleteResource,
  formatShortDate,
  loadResourcesData,
  updateResource,
  useSociovaQuery,
} from "@/lib/sociova-data";
import { useAuth } from "@/lib/auth";
import {
  LESSON_OPTIONS,
  parseLessonFromUrl,
  resolveResourceContent,
  type ResourceBody,
  type SovaLessonKind,
} from "@/lib/resource-content";
import { SovaLessonAnimation } from "@/components/site/sova-lesson";

const resourceIcons = {
  Guide: BookOpen,
  Video: PlayCircle,
  Worksheet: FileText,
  Exercise: PlayCircle,
  Checklist: FileText,
} as const;

const MAX_FILE_BYTES = 30 * 1024 * 1024;

function categoryLabel(category?: string) {
  switch (category) {
    case "Video":
      return "Video";
    case "Worksheet":
      return "Lembar kerja";
    case "Checklist":
      return "Daftar periksa";
    case "Exercise":
      return "Latihan";
    case "Guide":
      return "Panduan";
    default:
      return "Materi";
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export function ResourcesPage() {
  const { role } = useAuth();
  const { data: items, loading, error, refetch } = useSociovaQuery(loadResourcesData);
  const canManage = role === "teacher" || role === "therapist" || role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [lesson, setLesson] = useState<SovaLessonKind>("neutral");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<ResourceBody | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    const list = items ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (r: any) =>
        (r.title ?? "").toLowerCase().includes(needle) ||
        (r.description ?? "").toLowerCase().includes(needle) ||
        (r.author_name ?? "").toLowerCase().includes(needle) ||
        (r.category ?? "").toLowerCase().includes(needle),
    );
  }, [items, search]);

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setLesson("neutral");
    setFile(null);
    setPreview(null);
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPickFile = (picked: File | null) => {
    if (!picked) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      toast.error("File maksimal 30 MB");
      return;
    }
    const ok =
      picked.type.startsWith("image/") ||
      picked.type === "video/mp4" ||
      picked.type === "video/webm";
    if (!ok) {
      toast.error("Pilih foto atau video MP4");
      return;
    }
    setFile(picked);
    if (picked.type.startsWith("image/")) setPreview(URL.createObjectURL(picked));
    else setPreview(null);
    if (!category) setCategory(picked.type.startsWith("video/") ? "Video" : "Worksheet");
  };

  const startEdit = (item: any) => {
    const resolved = resolveResourceContent(item);
    setEditId(item.id);
    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setCategory(item.category ?? "Guide");
    setLesson(resolved.lesson ?? parseLessonFromUrl(item.url) ?? "neutral");
    setFile(null);
    setPreview(
      item.url && String(item.url).match(/\.(jpg|jpeg|png|webp|gif)$/i) ? item.url : null,
    );
    setShowForm(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Lengkapi judul dan ringkasan");
      return;
    }
    setSaving(true);
    try {
      let media_data_url: string | undefined;
      if (file) media_data_url = await readFileAsDataUrl(file);

      if (editId) {
        await updateResource({
          id: editId,
          title: title.trim(),
          description: description.trim(),
          category: category.trim() || "Guide",
          media_data_url,
          lesson,
        });
        toast.success("Materi diperbarui");
      } else {
        await createResource({
          title: title.trim(),
          description: description.trim(),
          category: category.trim() || "Guide",
          media_data_url,
          lesson,
        });
        toast.success("Materi ditambahkan");
      }
      resetForm();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tidak bisa menyimpan materi");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item: any) => {
    if (!window.confirm(`Hapus “${item.title}”?`)) return;
    try {
      await deleteResource(item.id);
      toast.success("Materi dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tidak bisa menghapus");
    }
  };

  if (loading) {
    return <StateCard title="Memuat materi" description="Sova sedang menyiapkan daftar." />;
  }
  if (error) return <StateCard title="Materi belum tersedia" description={error} />;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Materi"
        description={
          canManage
            ? "Bagikan panduan untuk keluarga. Materi dari Sova dan rekan bisa dibuka kapan saja."
            : "Panduan dari Sova, guru, dan terapis untuk mendampingi anak."
        }
        actions={
          canManage ? (
            <Button
              className="rounded-full btn-brand border-0"
              onClick={() => {
                if (showForm && !editId) resetForm();
                else {
                  setEditId(null);
                  setShowForm(true);
                }
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              {showForm && !editId ? "Tutup" : "Tambah materi"}
            </Button>
          ) : undefined
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari materi…"
          className="h-11 rounded-xl pl-9"
        />
      </div>

      {canManage && showForm && (
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <div className="mb-4 font-display text-lg font-bold">
            {editId ? "Edit materi" : "Materi baru"}
          </div>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="res-title">Judul</Label>
              <Input
                id="res-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul materi"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-cat">Kategori</Label>
              <Input
                id="res-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Panduan atau Video"
                className="h-11 rounded-xl"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="res-desc">Ringkasan</Label>
              <Textarea
                id="res-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ringkasan singkat"
                className="rounded-xl"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Animasi Sova</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {LESSON_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLesson(opt.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      lesson === opt.id
                        ? "border-[color:var(--brand)] bg-[color:var(--brand)]/10"
                        : "border-border/60 bg-background/30 hover:border-[color:var(--brand)]/40"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{opt.hint}</div>
                  </button>
                ))}
              </div>
              <div className="mt-2 overflow-hidden rounded-xl border border-border/60">
                <SovaLessonAnimation kind={lesson || "neutral"} />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Foto atau video (opsional)</Label>
              <Input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                className="h-11 max-w-md rounded-xl file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--brand)]/15 file:px-3 file:py-1 file:text-sm"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" />
                  {file.name}
                </p>
              )}
              {preview && (
                <img
                  src={preview}
                  alt=""
                  className="mt-2 max-h-36 rounded-xl border border-border/60 object-cover"
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full btn-brand border-0"
              >
                {saving ? "Menyimpan…" : editId ? "Simpan perubahan" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" className="rounded-full" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((r: any) => {
          const Icon = resourceIcons[r.category as keyof typeof resourceIcons] ?? BookOpen;
          const isSova = !r.created_by;
          const resolved = resolveResourceContent(r);
          const author = r.author_name || (isSova ? "Sova" : "Anggota");
          const when = r.created_at ? formatShortDate(r.created_at) : null;
          return (
            <Card
              key={r.id ?? r.title}
              className="flex h-full flex-col rounded-2xl border-border/60 bg-card/60 p-5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
                  <Icon className="h-4 w-4" />
                </span>
                {categoryLabel(r.category)}
                {isSova && <span className="text-[color:var(--brand)]">Sova</span>}
                {resolved.lesson && (
                  <span className="rounded-full bg-[color:var(--brand)]/15 px-2 py-0.5 text-[color:var(--brand)]">
                    Animasi
                  </span>
                )}
              </div>
              <div className="mt-3 font-semibold leading-snug">{r.title}</div>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Oleh {author}
                {when ? ` · ${when}` : ""}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="h-10 w-full rounded-full"
                  onClick={() => setActive(resolved)}
                >
                  <Eye className="mr-2 h-4 w-4" /> Buka
                </Button>
                {canManage && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full"
                      onClick={() => startEdit(r)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(r)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {filteredItems.length === 0 && (
          <Card className="rounded-2xl border-border/60 bg-card/60 p-6 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
            Tidak ada materi yang cocok.
          </Card>
        )}
      </div>

      {active && <ResourceModal content={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function ResourceModal({
  content,
  onClose,
}: {
  content: ResourceBody;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/60 bg-card p-5 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {categoryLabel(content.category)}
            </div>
            <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">{content.title}</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {(content.lesson || !content.mediaUrl) && (
          <div className="mb-5">
            <SovaLessonAnimation kind={content.lesson ?? "neutral"} />
          </div>
        )}

        {content.mediaUrl && content.mediaKind === "image" && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-border/60">
            <img
              src={content.mediaUrl}
              alt={content.title}
              className="max-h-[360px] w-full object-contain bg-background/40"
            />
          </div>
        )}

        {content.mediaUrl && content.mediaKind === "video" && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-border/60 bg-black">
            <video src={content.mediaUrl} controls className="max-h-[360px] w-full" preload="metadata" />
          </div>
        )}

        <div
          className="resource-body space-y-3 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-5 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
        />
      </div>
    </div>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-7xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
