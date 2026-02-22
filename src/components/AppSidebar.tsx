import { BarChart3, Upload, Table2, PieChart, Settings, TrendingUp, LayoutDashboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Upload Data", url: "/upload", icon: Upload },
  { title: "Data Table", url: "/table", icon: Table2 },
  { title: "Charts", url: "/charts", icon: BarChart3 },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">InsightFlow</h1>
            <p className="text-xs text-sidebar-muted">Business Analytics</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-[11px] uppercase tracking-wider font-semibold px-6">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-6 py-2.5 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors rounded-lg mx-2"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
