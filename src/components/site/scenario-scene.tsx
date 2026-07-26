import {
  Bus,
  Cake,
  HandMetal,
  MessageCircle,
  School,
  ShoppingBasket,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Sova } from "@/components/site/sova";
import { cn } from "@/lib/utils";
import { getScenarioGame } from "@/lib/simulation-scenes";

const SCENE_META: Record<
  string,
  { icon: LucideIcon; label: string; bg: string; accent: string }
> = {
  intro: {
    icon: HandMetal,
    label: "Kenalan",
    bg: "from-sky-500/20 via-background to-background",
    accent: "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  },
  playground: {
    icon: Users,
    label: "Taman bermain",
    bg: "from-emerald-500/20 via-background to-background",
    accent: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  },
  canteen: {
    icon: ShoppingBasket,
    label: "Kantin",
    bg: "from-amber-500/20 via-background to-background",
    accent: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
  },
  classroom: {
    icon: School,
    label: "Kelas",
    bg: "from-indigo-500/20 via-background to-background",
    accent: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
  },
  presentation: {
    icon: MessageCircle,
    label: "Presentasi",
    bg: "from-violet-500/20 via-background to-background",
    accent: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  },
  dentist: {
    icon: Stethoscope,
    label: "Dokter gigi",
    bg: "from-cyan-500/20 via-background to-background",
    accent: "bg-cyan-500/20 text-cyan-800 dark:text-cyan-300",
  },
  bus: {
    icon: Bus,
    label: "Bus",
    bg: "from-orange-500/20 via-background to-background",
    accent: "bg-orange-500/20 text-orange-800 dark:text-orange-300",
  },
  party: {
    icon: Cake,
    label: "Pesta",
    bg: "from-pink-500/20 via-background to-background",
    accent: "bg-pink-500/20 text-pink-700 dark:text-pink-300",
  },
};

export function ScenarioScene({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const game = getScenarioGame(title);
  const meta = SCENE_META[game.scene] ?? SCENE_META.intro;
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br p-4",
        meta.bg,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              meta.accent,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </div>
          <div className="mt-2 font-display text-base font-bold">{title}</div>
          <div className="text-xs text-muted-foreground">Bersama {game.role}</div>
        </div>
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-[color:var(--brand)]/20 blur-xl animate-pulse" />
          <Sova size={72} float />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <SceneTile icon={Icon} label={meta.label} active />
        <SceneTile icon={Users} label="Kamu" />
        <SceneTile icon={MessageCircle} label="Ngobrol" />
      </div>
    </div>
  );
}

function SceneTile({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl border border-border/50 bg-card/70 px-2 py-3 text-center backdrop-blur-sm",
        active && "border-[color:var(--brand)]/40 shadow-sm",
      )}
    >
      <Icon
        className={cn(
          "h-6 w-6",
          active ? "text-[color:var(--brand)] animate-float" : "text-muted-foreground",
        )}
      />
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
