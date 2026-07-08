import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/site/page-header";

export const Route = createFileRoute("/dashboard/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Settings"
        description="Atur pengalaman Sociova untuk keluarga atau kelasmu."
      />

      <Section title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input defaultValue="Amina Zayd" className="rounded-xl h-11" />
          </Field>
          <Field label="Email">
            <Input defaultValue="amina@family.com" className="rounded-xl h-11" />
          </Field>
          <Field label="Role">
            <Select defaultValue="parent">
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="therapist">Therapist</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Language">
            <Select defaultValue="hybrid">
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">
                  English Interface + Bahasa Indonesia Learning Content
                </SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Notifications">
        <Toggle label="Daily mission reminders" defaultChecked />
        <Toggle label="Weekly progress reports" defaultChecked />
        <Toggle label="Community replies" />
      </Section>

      <Section title="Accessibility">
        <Toggle label="Large font size" />
        <Toggle label="High contrast mode" />
        <Toggle label="Reduce motion" />
        <Toggle label="Screen reader optimizations" defaultChecked />
      </Section>

      <Section title="Privacy">
        <Toggle label="Allow anonymized research data" />
        <Toggle label="Share progress with therapist" defaultChecked />
        <div className="pt-2">
          <Button variant="outline" className="rounded-full">
            Download my data
          </Button>
        </div>
      </Section>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" className="rounded-full">
          Cancel
        </Button>
        <Button className="rounded-full btn-brand border-0">Save changes</Button>
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

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
