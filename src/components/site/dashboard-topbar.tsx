import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

export function DashboardTopbar() {
  const { user } = useAuth();
  const initials = user ? getInitials(user.fullName) : "?";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/60 px-4 backdrop-blur-xl">
      <SidebarTrigger className="rounded-full" />
      <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search activities, stories, students…"
          className="rounded-full pl-9 h-9 bg-secondary/60 border-transparent focus-visible:border-border"
        />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <div
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full btn-brand border-0 text-xs font-semibold"
          aria-label={user?.fullName ?? "Profile"}
          title={user?.fullName}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
