import { useState } from "react";
import {
  UserRound,
  Plus,
  Loader2,
  KeyRound,
  Trash2,
  Pencil,
  X,
  Link2,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/site/page-header";
import {
  createChildProfile,
  deleteChildProfile,
  linkCareTeam,
  loadChildrenData,
  unlinkCareTeam,
  updateChildProfile,
  useSociovaQuery,
} from "@/lib/sociova-data";

const NONE = "__none__";

type StaffOption = { email: string; full_name: string };

function StaffSelect({
  id,
  value,
  options,
  placeholder,
  emptyLabel,
  onChange,
}: {
  id?: string;
  value: string;
  options: StaffOption[];
  placeholder: string;
  emptyLabel: string;
  onChange: (email: string) => void;
}) {
  return (
    <Select
      value={value || NONE}
      onValueChange={(v) => onChange(v === NONE ? "" : v)}
    >
      <SelectTrigger id={id} className="h-11 rounded-xl">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{emptyLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.email} value={o.email}>
            {o.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const ageInputClass =
  "h-11 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

type ChildForm = {
  name: string;
  email: string;
  password: string;
  age: string;
  diagnosis: string;
  goal: string;
  teacherEmail: string;
  therapistEmail: string;
};

const emptyForm = (): ChildForm => ({
  name: "",
  email: "",
  password: "",
  age: "",
  diagnosis: "",
  goal: "",
  teacherEmail: "",
  therapistEmail: "",
});

export function ChildrenManager() {
  const { data, loading, error, refetch } = useSociovaQuery(loadChildrenData);
  const [form, setForm] = useState<ChildForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastLogin, setLastLogin] = useState<{ email: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChildForm>(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  const setField =
    (setter: typeof setForm, key: keyof ChildForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setter((prev) => ({ ...prev, [key]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nama anak wajib diisi");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email login anak wajib diisi");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password anak minimal 8 karakter");
      return;
    }
    setSaving(true);
    try {
      const result = await createChildProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        age: form.age ? Number(form.age) : undefined,
        diagnosis_level: form.diagnosis.trim() || undefined,
        learning_goal: form.goal.trim() || undefined,
        teacher_email: form.teacherEmail.trim() || undefined,
        therapist_email: form.therapistEmail.trim() || undefined,
      });
      if ((result as any).warning) {
        toast.success("Akun anak dibuat");
        toast.warning((result as any).warning);
      } else {
        toast.success("Akun anak berhasil dibuat. Anak bisa login sendiri.");
      }
      setLastLogin({ email: result.login?.email ?? form.email.trim().toLowerCase() });
      setForm(emptyForm());
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat akun anak");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (child: any) => {
    setEditingId(child.id);
    setEditForm({
      name: child.name ?? "",
      email: child.login_email ?? "",
      password: "",
      age: child.age != null ? String(child.age) : "",
      diagnosis: child.diagnosis_level ?? "",
      goal: child.learning_goal ?? "",
      teacherEmail: child.teacher_email ?? "",
      therapistEmail: child.therapist_email ?? "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.name.trim()) {
      toast.error("Nama anak wajib diisi");
      return;
    }
    if (editForm.password && editForm.password.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }
    setEditSaving(true);
    try {
      await updateChildProfile({
        child_id: editingId,
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        password: editForm.password || undefined,
        age: editForm.age ? Number(editForm.age) : undefined,
        diagnosis_level: editForm.diagnosis.trim() || undefined,
        learning_goal: editForm.goal.trim() || undefined,
        teacher_email: editForm.teacherEmail.trim() || undefined,
        therapist_email: editForm.therapistEmail.trim() || undefined,
      });
      toast.success("Data anak berhasil disimpan");
      setEditingId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan data anak");
    } finally {
      setEditSaving(false);
    }
  };

  const handleLink = async (
    childId: string,
    role: "teacher" | "therapist",
    email: string,
  ) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error(role === "teacher" ? "Isi email guru dulu" : "Isi email terapis dulu");
      return;
    }
    setLinking(`${childId}-${role}`);
    try {
      const result = await linkCareTeam({ child_id: childId, email: trimmed, role });
      const label = role === "teacher" ? "Guru" : "Terapis";
      toast.success(
        result.member?.name
          ? `${label} ${result.member.name} terhubung`
          : `${label} berhasil dihubungkan`,
      );
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghubungkan");
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (childId: string, role: "teacher" | "therapist") => {
    const label = role === "teacher" ? "guru" : "terapis";
    if (!window.confirm(`Lepas hubungan ${label} dari anak ini?`)) return;
    setLinking(`${childId}-unlink-${role}`);
    try {
      await unlinkCareTeam({ child_id: childId, role });
      toast.success(`${role === "teacher" ? "Guru" : "Terapis"} dilepas`);
      if (editingId === childId) {
        setEditForm((prev) =>
          role === "teacher"
            ? { ...prev, teacherEmail: "" }
            : { ...prev, therapistEmail: "" },
        );
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal melepaskan");
    } finally {
      setLinking(null);
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
      if (editingId === child.id) setEditingId(null);
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
  const teachers: StaffOption[] = data?.teachers ?? [];
  const therapists: StaffOption[] = data?.therapists ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Kelola Anak"
        description="Buat akun anak, ubah data, dan hubungkan guru atau terapis."
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
              value={form.name}
              onChange={setField(setForm, "name")}
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
              value={form.email}
              onChange={setField(setForm, "email")}
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
              value={form.password}
              onChange={setField(setForm, "password")}
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
              value={form.age}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  age: e.target.value.replace(/\D/g, "").slice(0, 2),
                }))
              }
              placeholder="Usia dalam tahun"
              className={ageInputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-dx">Diagnosis / level</Label>
            <Input
              id="child-dx"
              value={form.diagnosis}
              onChange={setField(setForm, "diagnosis")}
              placeholder="Contoh: ASD level 1"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="child-goal">Tujuan belajar</Label>
            <Input
              id="child-goal"
              value={form.goal}
              onChange={setField(setForm, "goal")}
              placeholder="Contoh: Berani menyapa teman"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-teacher">Guru</Label>
            <StaffSelect
              id="child-teacher"
              value={form.teacherEmail}
              options={teachers}
              placeholder={teachers.length ? "Pilih guru" : "Belum ada akun guru"}
              emptyLabel="Tidak dihubungkan"
              onChange={(email) => setForm((prev) => ({ ...prev, teacherEmail: email }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-therapist">Terapis</Label>
            <StaffSelect
              id="child-therapist"
              value={form.therapistEmail}
              options={therapists}
              placeholder={therapists.length ? "Pilih terapis" : "Belum ada akun terapis"}
              emptyLabel="Tidak dihubungkan"
              onChange={(email) => setForm((prev) => ({ ...prev, therapistEmail: email }))}
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
          children.map((child: any) => {
            const isEditing = editingId === child.id;
            return (
              <Card
                key={child.id}
                className="rounded-2xl border-border/60 bg-card/60 p-6 md:col-span-2 lg:col-span-1"
              >
                {!isEditing ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-display text-xl font-bold">{child.name}</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {child.age ?? "—"} tahun · {child.diagnosis_level ?? "Belum diisi"}
                        </p>
                        {child.login_email && (
                          <p className="mt-1 text-xs text-muted-foreground">{child.login_email}</p>
                        )}
                      </div>
                      <UserRound className="h-5 w-5 shrink-0 text-[color:var(--brand)]" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {child.learning_goal ?? "Belum ada tujuan belajar."}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p>
                        {child.user_id ? "Punya akun login" : "Belum terhubung akun login"}
                      </p>
                      <p>
                        Guru:{" "}
                        {child.teacher_name ?? "Belum dihubungkan"}
                      </p>
                      <p>
                        Terapis:{" "}
                        {child.therapist_name ?? "Belum dihubungkan"}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => openEdit(child)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
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
                  </>
                ) : (
                  <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleUpdate}>
                    <div className="flex items-center justify-between gap-2 sm:col-span-2">
                      <div className="font-display text-lg font-bold">Edit {child.name}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Nama</Label>
                      <Input
                        value={editForm.name}
                        onChange={setField(setEditForm, "name")}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email login</Label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={setField(setEditForm, "email")}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Password baru (opsional)</Label>
                      <Input
                        type="password"
                        value={editForm.password}
                        onChange={setField(setEditForm, "password")}
                        placeholder="Kosongkan jika tidak diganti"
                        className="h-11 rounded-xl"
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Usia</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={editForm.age}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            age: e.target.value.replace(/\D/g, "").slice(0, 2),
                          }))
                        }
                        className={ageInputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Diagnosis / level</Label>
                      <Input
                        value={editForm.diagnosis}
                        onChange={setField(setEditForm, "diagnosis")}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Tujuan belajar</Label>
                      <Input
                        value={editForm.goal}
                        onChange={setField(setEditForm, "goal")}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Guru</Label>
                      <div className="flex gap-2">
                        <div className="min-w-0 flex-1">
                          <StaffSelect
                            value={editForm.teacherEmail}
                            options={teachers}
                            placeholder={teachers.length ? "Pilih guru" : "Belum ada akun guru"}
                            emptyLabel="Tidak dihubungkan"
                            onChange={(email) =>
                              setEditForm((prev) => ({ ...prev, teacherEmail: email }))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 shrink-0 rounded-xl"
                          disabled={linking === `${child.id}-teacher` || !editForm.teacherEmail}
                          onClick={() =>
                            handleLink(child.id, "teacher", editForm.teacherEmail)
                          }
                        >
                          {linking === `${child.id}-teacher` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </Button>
                        {child.teacher_id && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 shrink-0 rounded-xl text-destructive"
                            disabled={linking === `${child.id}-unlink-teacher`}
                            onClick={() => handleUnlink(child.id, "teacher")}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Terapis</Label>
                      <div className="flex gap-2">
                        <div className="min-w-0 flex-1">
                          <StaffSelect
                            value={editForm.therapistEmail}
                            options={therapists}
                            placeholder={
                              therapists.length ? "Pilih terapis" : "Belum ada akun terapis"
                            }
                            emptyLabel="Tidak dihubungkan"
                            onChange={(email) =>
                              setEditForm((prev) => ({ ...prev, therapistEmail: email }))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 shrink-0 rounded-xl"
                          disabled={
                            linking === `${child.id}-therapist` || !editForm.therapistEmail
                          }
                          onClick={() =>
                            handleLink(child.id, "therapist", editForm.therapistEmail)
                          }
                        >
                          {linking === `${child.id}-therapist` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </Button>
                        {child.therapist_id && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 shrink-0 rounded-xl text-destructive"
                            disabled={linking === `${child.id}-unlink-therapist`}
                            onClick={() => handleUnlink(child.id, "therapist")}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <Button
                        type="submit"
                        disabled={editSaving}
                        className="rounded-xl btn-brand border-0"
                      >
                        {editSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Simpan perubahan"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setEditingId(null)}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
