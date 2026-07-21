import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { AuthShell } from "@/components/site/auth-shell";
import { Sova } from "@/components/site/sova";
import { saveSession, roleHome } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login · Sociova" },
      { name: "description", content: "Sign in to your Sociova account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow]         = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json() as { ok: boolean; error?: string; token?: string; userId?: string; role?: string; fullName?: string };
      if (!result.ok) {
        toast.error(result.error ?? "Terjadi kesalahan");
        return;
      }
      saveSession(result.token!, {
        userId:   result.userId!,
        email,
        role:     result.role as import("@/lib/roles").AppRole,
        fullName: result.fullName!,
      });
      toast.success("Selamat datang kembali!");
      navigate({ to: roleHome(result.role as import("@/lib/roles").AppRole), replace: true });
    } catch (err) {
      toast.error("Tidak bisa terhubung ke server. Coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-6 flex flex-col items-center text-center">
        <Sova size={88} />
        <h1 className="mt-3 font-display text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masuk untuk melanjutkan perjalanan belajar bersama Sova.
        </p>
      </div>
      <Card className="glass rounded-2xl p-6 shadow-xl">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="Email"
                className="pl-9 rounded-xl h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                required
                placeholder="Password"
                className="pr-9 rounded-xl h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox id="remember" /> <span>Ingat saya selama 30 hari</span>
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl btn-brand border-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link to="/register" className="font-medium text-[color:var(--brand)] hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </AuthShell>
  );
}
