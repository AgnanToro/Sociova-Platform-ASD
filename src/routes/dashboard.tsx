import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/site/dashboard-sidebar";
import { DashboardTopbar } from "@/components/site/dashboard-topbar";
import { GridBackground } from "@/components/site/grid-background";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Sociova" },
      { name: "description", content: "Your Sociova learning dashboard." },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="relative min-h-screen">
      <GridBackground />
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <DashboardSidebar />
          <SidebarInset className="flex min-h-screen flex-1 flex-col bg-transparent">
            <DashboardTopbar />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
