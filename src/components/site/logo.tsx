import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-xl btn-brand">
        {/* Speech bubble + heart + AI spark */}
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M4 6.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-4.2L7.5 19v-3.5H7a3 3 0 0 1-3-3v-6z"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <path
            d="M11.5 7.2c-1-1.2-3-.9-3 .9 0 1.6 3 3.4 3 3.4s3-1.8 3-3.4c0-1.8-2-2.1-3-.9z"
            fill="currentColor"
          />
          <path
            d="M17 3.2l.7 1.6 1.6.7-1.6.7L17 7.8l-.7-1.6-1.6-.7 1.6-.7L17 3.2z"
            fill="currentColor"
          />
        </svg>
      </div>
      <span className="font-display text-lg font-bold tracking-tight">Sociova</span>
    </div>
  );
}
