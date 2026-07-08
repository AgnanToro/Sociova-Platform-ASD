import { cn } from "@/lib/utils";

/**
 * Consistent premium AI startup background:
 * subtle 1px square grid + soft radial blue glows + floating blurred orbs.
 */
export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
    >
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute inset-0 glow-radial opacity-80" />
      <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[color:var(--brand-glow)] opacity-20 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-[520px] w-[520px] rounded-full bg-[color:var(--brand)] opacity-15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-[color:var(--brand-glow)] opacity-15 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" />
    </div>
  );
}
