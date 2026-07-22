import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/site/page-header";
import { loadSettingsData, saveSettingsData, useSociovaQuery } from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/settings")({ component: SettingsPage });

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

function SettingsPage() {
  const { data, loading, error, refetch } = useSociovaQuery(loadSettingsData);
  const [fullName, setFullName] = useState("");
  const [language, setLanguage] = useState("hybrid");
  const [settings, setSettings] = useState(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setFullName(data.profile?.full_name ?? "");
    setLanguage(data.profile?.language_mode ?? "hybrid");
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
  }, [data]);

  useEffect(() => {
    applyAccessibility(settings);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await saveSettingsData({
        full_name: fullName,
        language_mode: language,
        settings: {
          ...settings,
          screen_reader: data?.settings?.screen_reader ?? true,
          allow_research_data: data?.settings?.allow_research_data ?? false,
        },
      });
      toast.success("Pengaturan berhasil disimpan");
      refetch();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Pengaturan tidak dapat disimpan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StateCard title="Loading settings" description="Memuat profil dan preferensi Anda." />;
  if (error) return <StateCard title="Settings unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Settings" description="Atur profil, notifikasi topbar, aksesibilitas, dan privasi akun." />
      <Section title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 rounded-xl" /></Field>
          <Field label="Email"><Input value={data?.profile?.email ?? ""} readOnly className="h-11 rounded-xl opacity-70" /></Field>
          <Field label="Role"><Input value={roleLabel(data?.role)} readOnly className="h-11 rounded-xl opacity-70" /></Field>
          <Field label="Language">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">English UI + Bahasa Indonesia content</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>
      <Section title="Notifications">
        <p className="text-xs text-muted-foreground">Notifikasi muncul di ikon lonceng pojok kanan atas.</p>
        <Toggle label="Daily mission reminders" checked={settings.daily_mission_reminder} onCheckedChange={(value) => setSettings({ ...settings, daily_mission_reminder: value })} />
        <Toggle label="Weekly progress reports" checked={settings.weekly_progress_report} onCheckedChange={(value) => setSettings({ ...settings, weekly_progress_report: value })} />
        <Toggle label="Community replies" checked={settings.community_replies} onCheckedChange={(value) => setSettings({ ...settings, community_replies: value })} />
      </Section>
      <Section title="Accessibility">
        <p className="text-xs text-muted-foreground">Toggle ini langsung mengubah tampilan dashboard.</p>
        <Toggle label="Large font size" checked={settings.large_font} onCheckedChange={(value) => setSettings({ ...settings, large_font: value })} />
        <Toggle label="High contrast mode" checked={settings.high_contrast} onCheckedChange={(value) => setSettings({ ...settings, high_contrast: value })} />
        <Toggle label="Reduce motion" checked={settings.reduce_motion} onCheckedChange={(value) => setSettings({ ...settings, reduce_motion: value })} />
      </Section>
      <Section title="Privacy">
        <Toggle label="Share progress with therapist" checked={settings.share_with_therapist} onCheckedChange={(value) => setSettings({ ...settings, share_with_therapist: value })} />
      </Section>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="rounded-full btn-brand border-0">
          {saving ? "Menyimpan..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function roleLabel(role?: string) {
  return ({ child: "Anak", parent: "Orang Tua", teacher: "Guru", therapist: "Terapis" } as Record<string, string>)[role ?? ""] ?? "-";
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm"><h2 className="mb-4 font-display text-lg font-bold">{title}</h2><div className="space-y-4">{children}</div></Card>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3"><span className="text-sm">{label}</span><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}
function StateCard({ title, description }: { title: string; description: string }) {
  return <div className="mx-auto max-w-4xl"><Card className="rounded-2xl border-border/60 bg-card/60 p-6"><div className="font-display text-lg font-bold">{title}</div><p className="mt-1 text-sm text-muted-foreground">{description}</p></Card></div>;
}
