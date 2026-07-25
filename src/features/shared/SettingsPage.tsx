import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import {
  changePassword,
  loadSettingsData,
  saveSettingsData,
  useSociovaQuery,
  verifyCurrentPassword,
} from "@/lib/sociova-data";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS, type AuthRole } from "@/lib/roles";
import { getPasswordChecks, isPasswordStrong } from "@/lib/password-policy";

const defaults = {
  daily_mission_reminder: true,
  weekly_progress_report: true,
  community_replies: false,
  large_font: false,
  high_contrast: false,
  reduce_motion: false,
  share_with_therapist: true,
};

function applyAccessibility(settings: typeof defaults) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("a11y-large-font", Boolean(settings.large_font));
  root.classList.toggle("a11y-high-contrast", Boolean(settings.high_contrast));
  root.classList.toggle("a11y-reduce-motion", Boolean(settings.reduce_motion));
}

function roleLabel(role?: string | null) {
  if (!role) return "—";
  return ROLE_LABELS[role as AuthRole] ?? role;
}

export function SettingsPage() {
  const { role: authRole, user } = useAuth();
  const { data, loading, error, refetch } = useSociovaQuery(loadSettingsData);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [settings, setSettings] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  /** null = belum dicek, true = cocok, false = salah */
  const [currentPwMatch, setCurrentPwMatch] = useState<boolean | null>(null);
  const [checkingCurrent, setCheckingCurrent] = useState(false);

  const displayRole = roleLabel(data?.role ?? authRole);

  useEffect(() => {
    if (!data) return;
    setFullName(data.profile?.full_name ?? user?.fullName ?? "");
    setEmail(data.profile?.email ?? user?.email ?? "");
    const next = {
      daily_mission_reminder: data.settings?.daily_mission_reminder ?? true,
      weekly_progress_report: data.settings?.weekly_progress_report ?? true,
      community_replies: data.settings?.community_replies ?? false,
      large_font: Boolean(data.settings?.large_font),
      high_contrast: Boolean(data.settings?.high_contrast),
      reduce_motion: Boolean(data.settings?.reduce_motion),
      share_with_therapist: data.settings?.share_with_therapist ?? true,
    };
    setSettings(next);
    applyAccessibility(next);
  }, [data, user?.fullName]);

  useEffect(() => {
    applyAccessibility(settings);
  }, [settings]);

  // Realtime cek password saat ini (debounce)
  useEffect(() => {
    if (!currentPassword) {
      setCurrentPwMatch(null);
      setCheckingCurrent(false);
      return;
    }
    setCheckingCurrent(true);
    setCurrentPwMatch(null);
    const t = window.setTimeout(async () => {
      try {
        const res = await verifyCurrentPassword(currentPassword);
        setCurrentPwMatch(Boolean(res.ok));
      } catch {
        setCurrentPwMatch(false);
      } finally {
        setCheckingCurrent(false);
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [currentPassword]);

  const save = async () => {
    const nextEmail = email.trim().toLowerCase();
    if (!fullName.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    if (!nextEmail || !nextEmail.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }
    setSaving(true);
    try {
      await saveSettingsData({
        full_name: fullName.trim(),
        email: nextEmail,
        language_mode: data?.profile?.language_mode ?? "hybrid",
        settings: {
          ...settings,
          screen_reader: data?.settings?.screen_reader ?? true,
          allow_research_data: data?.settings?.allow_research_data ?? false,
        },
      });
      // keep local session email in sync
      try {
        const raw = localStorage.getItem("sociova-user");
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.fullName = fullName.trim();
          parsed.email = nextEmail;
          localStorage.setItem("sociova-user", JSON.stringify(parsed));
        }
      } catch {
        /* ignore */
      }
      toast.success("Perubahan disimpan");
      refetch();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Tidak bisa menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const pwChecks = getPasswordChecks(newPassword);
  const passwordOk = isPasswordStrong(newPassword);
  const confirmOk = confirmPassword.length > 0 && newPassword === confirmPassword;
  const confirmMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const sameAsOld =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;
  const canSubmitPassword =
    currentPwMatch === true &&
    passwordOk &&
    confirmOk &&
    !sameAsOld &&
    !savingPw &&
    !checkingCurrent;

  const savePassword = async () => {
    if (!canSubmitPassword) return;
    setSavingPw(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password berhasil diganti");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPwMatch(null);
    } catch {
      setCurrentPwMatch(false);
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return <StateCard title="Memuat pengaturan" description="Menyiapkan profil Anda." />;
  }
  if (error) {
    return <StateCard title="Pengaturan belum tersedia" description={error} />;
  }

  const showShareTherapist = authRole === "parent" || authRole === "child";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Pengaturan"
        description="Perbarui profil, password, dan kenyamanan tampilan."
      />

      <Section title="Profil">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl"
              placeholder="Nama lengkap"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
              placeholder="email@contoh.com"
            />
          </Field>
          <Field label="Peran">
            <Input value={displayRole} readOnly className="h-11 rounded-xl opacity-70" />
          </Field>
        </div>
      </Section>

      <Section title="Ganti password">
        <div className="grid gap-4">
          <Field label="Password saat ini">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`h-11 rounded-xl ${
                currentPassword.length === 0
                  ? ""
                  : checkingCurrent
                    ? ""
                    : currentPwMatch === true
                      ? "border-[color:var(--success)]"
                      : currentPwMatch === false
                        ? "border-destructive"
                        : ""
              }`}
              placeholder="Password lama"
              autoComplete="current-password"
            />
            {currentPassword.length > 0 && checkingCurrent && (
              <p className="mt-1.5 text-xs text-muted-foreground">Memeriksa…</p>
            )}
            {currentPassword.length > 0 && !checkingCurrent && currentPwMatch === true && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[color:var(--success)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Password sama dengan password saat ini
              </p>
            )}
            {currentPassword.length > 0 && !checkingCurrent && currentPwMatch === false && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                Password berbeda dari password saat ini
              </p>
            )}
          </Field>
          <Field label="Password baru">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`h-11 rounded-xl ${sameAsOld ? "border-destructive" : ""}`}
              placeholder="Minimal 8 karakter, huruf kapital, angka"
              autoComplete="new-password"
            />
            {newPassword.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {[
                  { ok: pwChecks.length, label: "Minimal 8 karakter" },
                  { ok: pwChecks.upper, label: "Mengandung huruf kapital" },
                  { ok: pwChecks.number, label: "Mengandung angka" },
                  { ok: pwChecks.special, label: "Karakter spesial (opsional)" },
                ].map((c) => (
                  <li key={c.label} className="flex items-center gap-1.5 text-xs">
                    {c.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                      {c.label}
                    </span>
                  </li>
                ))}
                {currentPassword.length > 0 && (
                  <li className="flex items-center gap-1.5 text-xs">
                    {!sameAsOld ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className={!sameAsOld ? "text-foreground" : "text-destructive"}>
                      {sameAsOld
                        ? "Password baru sama dengan password lama"
                        : "Berbeda dari password saat ini"}
                    </span>
                  </li>
                )}
              </ul>
            )}
          </Field>
          <Field label="Ulangi password baru">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`h-11 rounded-xl ${
                confirmPassword.length > 0
                  ? confirmOk
                    ? "border-[color:var(--success)]"
                    : "border-destructive"
                  : ""
              }`}
              placeholder="Ketik ulang password"
              autoComplete="new-password"
            />
            {confirmMismatch && (
              <p className="mt-1.5 text-xs text-destructive">Password tidak sama</p>
            )}
            {confirmOk && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[color:var(--success)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Password cocok
              </p>
            )}
          </Field>
          <div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!canSubmitPassword}
              onClick={savePassword}
            >
              {savingPw ? "Menyimpan…" : "Simpan password"}
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Display">
        <Toggle
          label="Large font size"
          checked={settings.large_font}
          onCheckedChange={(value) => setSettings({ ...settings, large_font: value })}
        />
        <Toggle
          label="High contrast mode"
          checked={settings.high_contrast}
          onCheckedChange={(value) => setSettings({ ...settings, high_contrast: value })}
        />
        <Toggle
          label="Reduce motion"
          checked={settings.reduce_motion}
          onCheckedChange={(value) => setSettings({ ...settings, reduce_motion: value })}
        />
      </Section>

      {showShareTherapist && (
        <Section title="Privasi">
          <Toggle
            label="Bagikan progres ke terapis"
            checked={settings.share_with_therapist}
            onCheckedChange={(value) =>
              setSettings({ ...settings, share_with_therapist: value })
            }
          />
        </Section>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="rounded-full btn-brand border-0">
          {saving ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-4xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
