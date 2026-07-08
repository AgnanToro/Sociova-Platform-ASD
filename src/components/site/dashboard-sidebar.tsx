import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Bot,
  BookHeart,
  Smile,
  Trophy,
  BarChart3,
  Library,
  Users,
  Settings,
  LogOut,
  Baby,
  HeartPulse,
  GraduationCap,
  ClipboardList,
  LineChart,
  FileText,
  UserRound,
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
import type { AppRole } from "@/lib/roles";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

// Menu items per role
const ITEMS_BY_ROLE: Record<AppRole | "default", Item[]> = {
  child: [
    { to: "/dashboard",            label: "Dashboard",       icon: LayoutDashboard, exact: true },
    { to: "/dashboard/journey",    label: "Journey",         icon: Map },
    { to: "/dashboard/simulation", label: "AI Simulation",   icon: Bot },
    { to: "/dashboard/emotion",    label: "Emotion Analysis",icon: Smile },
    { to: "/dashboard/achievements",label: "Achievements",   icon: Trophy },
    { to: "/dashboard/resources",  label: "Resources",       icon: Library },
    { to: "/dashboard/community",  label: "Community",       icon: Users },
    { to: "/dashboard/settings",   label: "Settings",        icon: Settings },
  ],
  parent: [
    { to: "/dashboard",            label: "Dashboard",       icon: LayoutDashboard, exact: true },
    { to: "/dashboard/parent",     label: "Child Progress",  icon: Baby },
    { to: "/dashboard/story",      label: "Social Story",    icon: BookHeart },
    { to: "/dashboard/analytics",  label: "Weekly Reports",  icon: BarChart3 },
    { to: "/dashboard/resources",  label: "Resources",       icon: Library },
    { to: "/dashboard/community",  label: "Community",       icon: Users },
    { to: "/dashboard/settings",   label: "Settings",        icon: Settings },
  ],
  therapist: [
    { to: "/dashboard",            label: "Dashboard",       icon: LayoutDashboard, exact: true },
    { to: "/dashboard/therapist",  label: "Clients",         icon: UserRound },
    { to: "/dashboard/emotion",    label: "Emotion Trends",  icon: HeartPulse },
    { to: "/dashboard/story",      label: "Session Notes",   icon: FileText },
    { to: "/dashboard/analytics",  label: "Analytics",       icon: LineChart },
    { to: "/dashboard/resources",  label: "Resources",       icon: Library },
    { to: "/dashboard/community",  label: "Community",       icon: Users },
    { to: "/dashboard/settings",   label: "Settings",        icon: Settings },
  ],
  teacher: [
    { to: "/dashboard",            label: "Dashboard",       icon: LayoutDashboard, exact: true },
    { to: "/dashboard/teacher",    label: "Students",        icon: GraduationCap },
    { to: "/dashboard/analytics",  label: "Class Progress",  icon: BarChart3 },
    { to: "/dashboard/simulation", label: "Assignments",     icon: ClipboardList },
    { to: "/dashboard/resources",  label: "Resources",       icon: Library },
    { to: "/dashboard/community",  label: "Community",       icon: Users },
    { to: "/dashboard/settings",   label: "Settings",        icon: Settings },
  ],
  default: [
    { to: "/dashboard",            label: "Dashboard",       icon: LayoutDashboard, exact: true },
    { to: "/dashboard/settings",   label: "Settings",        icon: Settings },
  ],
};

export function DashboardSidebar() {
  const { state } = useSidebar();
  const { role, signOut } = useAuth();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = ITEMS_BY_ROLE[role ?? "default"] ?? ITEMS_BY_ROLE.default;

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

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
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.to, item.exact)}
                    tooltip={item.label}
                    className="rounded-xl data-[active=true]:bg-[color:var(--brand)]/10 data-[active=true]:text-[color:var(--brand)]"
                  >
                    <Link to={item.to as "/dashboard"} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
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
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
