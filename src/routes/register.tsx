import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, User, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AuthShell } from "@/components/site/auth-shell";
import { saveSession, roleHome } from "@/lib/auth";
import type { AuthRole } from "@/lib/roles";
import { getPasswordChecks, isPasswordStrong } from "@/lib/password-policy";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar · Sociova" },
      { name: "description", content: "Buat akun orang tua Sociova dan mulai mendampingi anak." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const checks    = getPasswordChecks(password);
  const passwordOk = isPasswordStrong(password);
  const confirmOk  = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordOk) {
      toast.error("Password harus minimal 8 karakter, huruf kapital, dan angka");
      return;
    }
    if (password !== confirm) {
      toast.error("Password tidak sama");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      const result = await res.json() as { ok: boolean; error?: string; token?: string; userId?: string; role?: AuthRole; fullName?: string };
      if (!result.ok) {
        toast.error(result.error ?? "Terjadi kesalahan");
        return;
      }
      saveSession(result.token!, {
        userId:   result.userId!,
        email,
        role:     result.role!,
        fullName: result.fullName!,
      });
      toast.success("Akun berhasil dibuat. Selamat datang di Sociova.");
      navigate({ to: roleHome(result.role!), replace: true });
    } catch (err) {
      toast.error("Tidak bisa terhubung ke server. Coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold">Daftar · Sociova</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat akun orang tua dan mulai mendampingi anak bersama Sova.
        </p>
      </div>
      <Card className="glass rounded-2xl p-6 shadow-xl">
        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                required
                placeholder="Masukkan nama lengkap"
                className="pl-9 h-11 rounded-xl"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="contoh@gmail.com"
                className="pl-9 h-11 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                required
                placeholder="Min. 8 karakter, huruf kapital, angka"
                className="pr-9 h-11 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPw ? "Sembunyikan" : "Tampilkan"}
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {[
                  { ok: checks.length,  label: "Minimal 8 karakter" },
                  { ok: checks.upper,   label: "Mengandung huruf kapital" },
                  { ok: checks.number,  label: "Mengandung angka" },
                  { ok: checks.special, label: "Karakter spesial (opsional)" },
                ].map((c) => (
                  <li key={c.label} className="flex items-center gap-1.5 text-xs">
                    {c.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" />
                      : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                    <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Konfirmasi password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showCf ? "text" : "password"}
                required
                placeholder="Ketik ulang password"
                className={`pr-9 h-11 rounded-xl ${
                  confirm.length > 0
                    ? confirmOk ? "border-[color:var(--success)]" : "border-destructive"
                    : ""
                }`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button
                type="button"
                aria-label={showCf ? "Sembunyikan" : "Tampilkan"}
                onClick={() => setShowCf((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm.length > 0 && !confirmOk && (
              <p className="text-xs text-destructive">Password tidak sama</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !passwordOk || !confirmOk}
            className="w-full h-11 rounded-xl btn-brand border-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat akun"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Dengan mendaftar kamu setuju dengan Syarat &amp; Kebijakan Privasi kami.
          </p>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link to="/login" className="font-medium text-[color:var(--brand)] hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
