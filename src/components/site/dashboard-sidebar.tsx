import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Bot,
  Smile,
  Trophy,
  BarChart3,
  Library,
  Users,
  Settings,
  LogOut,
  GraduationCap,
  ClipboardList,
  FileText,
  FileBarChart,
  UserRound,
  BookHeart,
  UserPlus,
  ChartLine,
  MessageSquare,
} from "lucide-react";
import { Logo } from "./logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import type { AuthRole } from "@/lib/roles";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const ITEMS_BY_ROLE: Record<AuthRole | "default", Item[]> = {
  child: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/child/mission", label: "Today's Mission", icon: ClipboardList },
    { to: "/dashboard/child/journey", label: "Journey", icon: Map },
    { to: "/dashboard/child/simulation", label: "AI Simulation", icon: Bot },
    { to: "/dashboard/child/emotion", label: "Emotion Training", icon: Smile },
    { to: "/dashboard/child/story", label: "Social Story", icon: BookHeart },
    { to: "/dashboard/child/achievements", label: "Achievements", icon: Trophy },
    { to: "/dashboard/shared/community", label: "Community", icon: Users },
    { to: "/dashboard/shared/settings", label: "Settings", icon: Settings },
  ],
  parent: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/parent/children", label: "Kelola Anak", icon: UserPlus },
    { to: "/dashboard/parent", label: "Child Progress", icon: ChartLine, exact: true },
    { to: "/dashboard/parent/report", label: "Weekly Report", icon: FileBarChart },
    { to: "/dashboard/parent/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/dashboard/parent/resources", label: "Materi", icon: Library },
    { to: "/dashboard/shared/community", label: "Community", icon: Users },
    { to: "/dashboard/shared/settings", label: "Settings", icon: Settings },
  ],
  teacher: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/teacher", label: "Students", icon: GraduationCap, exact: true },
    { to: "/dashboard/teacher/observations", label: "Observations", icon: ClipboardList },
    { to: "/dashboard/teacher/report", label: "Weekly Report", icon: FileBarChart },
    { to: "/dashboard/teacher/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/dashboard/teacher/resources", label: "Materi", icon: Library },
    { to: "/dashboard/shared/community", label: "Community", icon: Users },
    { to: "/dashboard/shared/settings", label: "Settings", icon: Settings },
  ],
  therapist: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/therapist", label: "Clients", icon: UserRound, exact: true },
    { to: "/dashboard/therapist/sessions", label: "Session Notes", icon: FileText },
    { to: "/dashboard/therapist/report", label: "Weekly Report", icon: FileBarChart },
    { to: "/dashboard/therapist/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/dashboard/therapist/resources", label: "Materi", icon: Library },
    { to: "/dashboard/shared/community", label: "Community", icon: Users },
    { to: "/dashboard/shared/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/admin/users", label: "Pengguna", icon: Users },
    { to: "/dashboard/admin/resources", label: "Materi", icon: Library },
    { to: "/dashboard/admin/community", label: "Community", icon: MessageSquare },
    { to: "/dashboard/shared/settings", label: "Pengaturan", icon: Settings },
  ],
  default: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/shared/settings", label: "Settings", icon: Settings },
  ],
};

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function DashboardSidebar() {
  const { state } = useSidebar();
  const { role, signOut } = useAuth();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = ITEMS_BY_ROLE[role ?? "default"] ?? ITEMS_BY_ROLE.default;
  const current = normalizePath(pathname);

  const isActive = (to: string, exact?: boolean) => {
    const target = normalizePath(to);
    if (exact || target === "/dashboard") return current === target;
    // Prefer the longest matching menu item so parent paths don't "stick"
    const matches = items
      .map((item) => normalizePath(item.to))
      .filter((path) => current === path || current.startsWith(`${path}/`));
    const best = matches.sort((a, b) => b.length - a.length)[0];
    return best === target;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <Logo className={collapsed ? "[&_span]:hidden" : ""} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={`${item.to}-${item.label}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.to, item.exact)}
                    tooltip={item.label}
                    className="rounded-xl data-[active=true]:bg-[color:var(--brand)]/10 data-[active=true]:text-[color:var(--brand)]"
                  >
                    <Link to={item.to as "/dashboard"} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              className="rounded-xl text-muted-foreground hover:text-destructive"
              onClick={signOut}
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Log out</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
