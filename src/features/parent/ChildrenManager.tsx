import { useState } from "react";
import { UserRound, Plus, Loader2, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/site/page-header";
import {
  createChildProfile,
  deleteChildProfile,
  loadChildrenData,
  useSociovaQuery,
} from "@/lib/sociova-data";

const ageInputClass =
  "h-11 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function ChildrenManager() {
  const { data, loading, error, refetch } = useSociovaQuery(loadChildrenData);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastLogin, setLastLogin] = useState<{ email: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama anak wajib diisi");
      return;
    }
    if (!email.trim()) {
      toast.error("Email login anak wajib diisi");
      return;
    }
    if (password.length < 8) {
      toast.error("Password anak minimal 8 karakter");
      return;
    }
    setSaving(true);
    try {
      const result = await createChildProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        age: age ? Number(age) : undefined,
        diagnosis_level: diagnosis.trim() || undefined,
        learning_goal: goal.trim() || undefined,
      });
      toast.success("Akun anak berhasil dibuat. Anak bisa login sendiri.");
      setLastLogin({ email: result.login?.email ?? email.trim().toLowerCase() });
      setName("");
      setEmail("");
      setPassword("");
      setAge("");
      setDiagnosis("");
      setGoal("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat akun anak");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (child: { id: string; name: string }) => {
    const ok = window.confirm(
      `Hapus akun ${child.name}? Data latihan dan progress anak juga akan dihapus.`,
    );
    if (!ok) return;
    setDeletingId(child.id);
    try {
      await deleteChildProfile(child.id);
      toast.success(`Akun ${child.name} berhasil dihapus`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus akun anak");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="rounded-2xl p-6">
          <div className="font-display text-lg font-bold">Memuat daftar anak…</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="rounded-2xl p-6">
          <div className="font-display text-lg font-bold">Gagal memuat</div>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  const children = data?.children ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Kelola Anak"
        description="Orang tua membuat dan mengelola akun login anak. Fitur belajar hanya muncul di akun anak."
      />

      {lastLogin && (
        <Card className="rounded-2xl border-[color:var(--brand)]/40 bg-[color:var(--brand)]/5 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <KeyRound className="h-4 w-4 text-[color:var(--brand)]" />
            Akun siap dipakai
          </div>
          <p className="mt-1 text-muted-foreground">
            Anak login di halaman Masuk dengan email <strong>{lastLogin.email}</strong> dan password
            yang Anda set.
          </p>
        </Card>
      )}

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Plus className="h-5 w-5 text-[color:var(--brand)]" />
          Buat akun anak
        </div>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="child-name">Nama</Label>
            <Input
              id="child-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap anak"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-email">Email login anak</Label>
            <Input
              id="child-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email untuk login anak"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-password">Password login anak</Label>
            <Input
              id="child-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="h-11 rounded-xl"
              required
              minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-age">Usia</Label>
            <Input
              id="child-age"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="Usia dalam tahun"
              className={ageInputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-dx">Diagnosis / level</Label>
            <Input
              id="child-dx"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Contoh: ASD level 1"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="child-goal">Tujuan belajar</Label>
            <Input
              id="child-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Contoh: Berani menyapa teman"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving} className="rounded-xl btn-brand border-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat akun anak"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {children.length === 0 ? (
          <Card className="rounded-2xl border-border/60 bg-card/60 p-6 md:col-span-2">
            <p className="text-sm text-muted-foreground">
              Belum ada akun anak. Buat di atas agar anak bisa login dan memakai fitur belajar.
            </p>
          </Card>
        ) : (
          children.map((child: any) => (
            <Card key={child.id} className="rounded-2xl border-border/60 bg-card/60 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl font-bold">{child.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {child.age ?? "—"} tahun · {child.diagnosis_level ?? "Belum diisi"}
                  </p>
                </div>
                <UserRound className="h-5 w-5 shrink-0 text-[color:var(--brand)]" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {child.learning_goal ?? "Belum ada tujuan belajar."}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {child.user_id ? "Punya akun login" : "Belum terhubung akun login"}
                  {child.teacher_id ? " · terhubung guru" : ""}
                  {child.therapist_id ? " · terhubung terapis" : ""}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deletingId === child.id}
                  onClick={() => handleDelete({ id: child.id, name: child.name })}
                >
                  {deletingId === child.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Hapus
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
