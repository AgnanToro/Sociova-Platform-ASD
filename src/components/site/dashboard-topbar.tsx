import { Bell, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth";
import { loadNotificationsData, useSociovaQuery } from "@/lib/sociova-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function DashboardTopbar() {
  const { user } = useAuth();
  const initials = user ? getInitials(user.fullName) : "?";
  const { data, loading } = useSociovaQuery(loadNotificationsData, [user?.userId]);
  const [open, setOpen] = useState(false);
  const items = data?.items ?? [];
  const unread = data?.unread ?? items.length;

  const emptyText = useMemo(() => {
    if (loading) return "Memuat notifikasi...";
    return "Tidak ada notifikasi aktif.";
  }, [loading]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/60 px-4 backdrop-blur-xl">
      <SidebarTrigger className="rounded-full" />
      <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search activities, stories, students..."
          className="h-9 rounded-full border-transparent bg-secondary/60 pl-9 focus-visible:border-border"
        />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--brand)] px-1 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 rounded-2xl p-0">
            <div className="border-b border-border/60 px-4 py-3">
              <div className="font-display text-sm font-bold">Notifications</div>
              <div className="text-xs text-muted-foreground">Berdasarkan preferensi Settings</div>
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto p-2">
              {items.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
              )}
              {items.map((item: any) => (
                <div key={item.id} className="rounded-xl px-3 py-2 hover:bg-accent/50">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{item.body}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{item.time}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-border/60 p-2">
              <Button asChild variant="ghost" className="w-full justify-start rounded-xl text-sm">
                <Link to="/dashboard/settings" onClick={() => setOpen(false)}>
                  Atur preferensi notifikasi
                </Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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
