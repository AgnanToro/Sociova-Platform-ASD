import mascotImg from "@/assets/sociova-mascot.png";
import { cn } from "@/lib/utils";

type SovaProps = {
  size?: number;
  className?: string;
  float?: boolean;
  glow?: boolean;
};

export function Sova({ size = 96, className, float = true, glow = true }: SovaProps) {
  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-2 rounded-full bg-[color:var(--brand)]/25 blur-2xl"
          aria-hidden
        />
      )}
      <img
        src={mascotImg}
        alt="Sova — Sociova AI mascot"
        width={size}
        height={size}
        className={cn(
          "relative object-contain drop-shadow-[0_10px_24px_color-mix(in_oklab,var(--brand)_35%,transparent)]",
          float && "animate-float",
        )}
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export function SovaBubble({
  size = 72,
  message,
  className,
}: {
  size?: number;
  message: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      <Sova size={size} />
      <div className="relative max-w-xs rounded-2xl rounded-bl-sm border border-border/60 bg-card/80 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm">
        {message}
      </div>
    </div>
  );
}
