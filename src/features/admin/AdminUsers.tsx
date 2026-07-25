import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/site/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  formatShortDate,
  loadAdminUsers,
  useSociovaQuery,
} from "@/lib/sociova-data";
import { ROLE_LABELS, type AuthRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth";

const ASSIGNABLE: AuthRole[] = ["parent", "teacher", "therapist", "admin", "child"];
const CREATE_ROLES: AuthRole[] = ["teacher", "therapist", "parent", "admin"];

type EditForm = {
  userId: string;
  fullName: string;
  email: string;
  role: AuthRole;
  newPassword: string;
};

type CreateForm = {
  fullName: string;
  email: string;
  password: string;
  role: AuthRole;
};

export function AdminUsers() {
  const { user: me } = useAuth();
  const { data, loading, error, refetch } = useSociovaQuery(loadAdminUsers);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditForm | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    fullName: "",
    email: "",
    password: "",
    role: "teacher",
  });
  const [saving, setSaving] = useState(false);

  const startEdit = (u: any, currentRole: AuthRole) => {
    setEdit({
      userId: u.user_id,
      fullName: u.full_name ?? "",
      email: u.email ?? "",
      role: currentRole,
      newPassword: "",
    });
  };

  const closeEdit = () => setEdit(null);

  const openCreate = () => {
    setCreateForm({ fullName: "", email: "", password: "", role: "teacher" });
    setCreateOpen(true);
  };

  const saveCreate = async () => {
    if (!createForm.fullName.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }
    if (createForm.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    setSaving(true);
    try {
      await adminCreateUser({
        full_name: createForm.fullName.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        role: createForm.role,
      });
      toast.success("Pengguna ditambahkan");
      setCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tidak bisa menambah pengguna");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    if (!edit.fullName.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    if (!edit.email.trim() || !edit.email.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }
    if (edit.newPassword && edit.newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }
    setSaving(true);
    try {
      await adminUpdateUser({
        user_id: edit.userId,
        full_name: edit.fullName.trim(),
        email: edit.email.trim().toLowerCase(),
        role: edit.role,
        new_password: edit.newPassword.trim() || undefined,
      });
      toast.success("Akun diperbarui");
      setEdit(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tidak bisa menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (u: any) => {
    if (u.user_id === me?.userId) {
      toast.error("Tidak bisa menghapus akun sendiri");
      return;
    }
    if (!window.confirm(`Hapus akun ${u.full_name || u.email}?`)) return;
    try {
      await adminDeleteUser(u.user_id);
      toast.success("Akun dihapus");
      if (edit?.userId === u.user_id) setEdit(null);
      if (openId === u.user_id) setOpenId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tidak bisa menghapus akun");
    }
  };

  const users = useMemo(() => {
    const list = data?.users ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (u: any) =>
        (u.full_name ?? "").toLowerCase().includes(needle) ||
        (u.email ?? "").toLowerCase().includes(needle) ||
        (u.roles ?? []).some((r: string) =>
          (ROLE_LABELS[r as AuthRole] ?? r).toLowerCase().includes(needle),
        ),
    );
  }, [data?.users, q]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="rounded-2xl p-6">
          <div className="font-display text-lg font-bold">Memuat daftar anggota…</div>
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Pengguna"
        description="Tambah guru atau terapis, edit akun, atau hapus jika perlu."
        actions={
          <Button className="rounded-full btn-brand border-0" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> Tambah pengguna
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama atau email"
          className="h-11 rounded-xl pl-9"
        />
      </div>

      <div className="space-y-3">
        {users.map((u: any) => {
          const currentRole = (u.roles?.[0] as AuthRole) ?? "parent";
          const isSelf = u.user_id === me?.userId;
          const open = openId === u.user_id;

          return (
            <Card key={u.user_id} className="rounded-2xl border-border/60 bg-card/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">
                    {u.full_name || "—"}
                    {isSelf ? (
                      <span className="ml-2 text-xs text-[color:var(--brand)]">Anda</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Bergabung {u.created_at ? formatShortDate(u.created_at) : "—"} ·{" "}
                    <span className="rounded-full bg-[color:var(--brand)]/10 px-2 py-0.5 text-[color:var(--brand)]">
                      {ROLE_LABELS[currentRole] ?? currentRole}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setOpenId(open ? null : u.user_id)}
                  >
                    {open ? (
                      <>
                        <ChevronUp className="mr-1 h-4 w-4" /> Tutup
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1 h-4 w-4" /> Detail
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => startEdit(u, currentRole)}
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  {!isSelf && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(u)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Hapus
                    </Button>
                  )}
                </div>
              </div>

              {open && (
                <div className="mt-4 rounded-xl border border-border/60 bg-background/30 p-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div>{u.email || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Bergabung</div>
                      <div>{u.created_at ? formatShortDate(u.created_at) : "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Diperbarui</div>
                      <div>{u.updated_at ? formatShortDate(u.updated_at) : "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Peran</div>
                      <div>{ROLE_LABELS[currentRole] ?? currentRole}</div>
                    </div>
                    {currentRole === "parent" && (
                      <div className="sm:col-span-2">
                        <div className="text-xs text-muted-foreground">Anak terhubung</div>
                        <div>
                          {(u.children ?? []).length
                            ? (u.children as any[])
                                .map((c) => `${c.name}${c.age != null ? ` (${c.age} th)` : ""}`)
                                .join(", ")
                            : "Belum ada"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {users.length === 0 && (
          <Card className="rounded-2xl border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
            Tidak ada anggota yang cocok.
          </Card>
        )}
      </div>

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Tambah pengguna</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Buat akun guru, terapis, atau peran lain.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setCreateOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nama</Label>
                <Input
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="email@contoh.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Peran</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(v) => setCreateForm({ ...createForm, role: v as AuthRole })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setCreateOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="rounded-full btn-brand border-0"
                disabled={saving}
                onClick={saveCreate}
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {edit && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Edit akun</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ubah nama, email, peran, atau password.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={closeEdit}
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nama</Label>
                <Input
                  value={edit.fullName}
                  onChange={(e) => setEdit({ ...edit, fullName: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={edit.email}
                  onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="email@contoh.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Peran</Label>
                <Select
                  value={edit.role}
                  onValueChange={(v) => setEdit({ ...edit, role: v as AuthRole })}
                  disabled={edit.userId === me?.userId && edit.role === "admin"}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Password baru (opsional)</Label>
                <Input
                  type="password"
                  value={edit.newPassword}
                  onChange={(e) => setEdit({ ...edit, newPassword: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="Kosongkan jika tidak diganti"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">Minimal 8 karakter jika diisi.</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={closeEdit}>
                Batal
              </Button>
              <Button
                type="button"
                className="rounded-full btn-brand border-0"
                disabled={saving}
                onClick={saveEdit}
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
