import {
  LayoutDashboard, Users, History, Sparkles, FileText, Layers,
  TrendingUp, Search, Settings, BookOpen, LogOut, CalendarDays,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Class History", url: "/history", icon: History },
  { title: "Lesson Plans", url: "/plans", icon: Layers },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
];

const aiItems = [
  { title: "Lesson Generator", url: "/generate-lesson", icon: Sparkles },
  { title: "Material Generator", url: "/generate-material", icon: FileText },
];

const trackItems = [
  { title: "Progress", url: "/progress", icon: TrendingUp },
  { title: "Search", url: "/search", icon: Search },
  { title: "Vocab Modules", url: "/settings", icon: BookOpen },
];

function NavGroup({ label, items }: { label: string; items: typeof mainItems }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-2 px-4 py-5">
        <Sparkles className="h-6 w-6 text-sidebar-primary shrink-0" />
        {!collapsed && (
          <span className="font-display text-lg font-bold text-sidebar-foreground tracking-tight">
            TeacherMind
          </span>
        )}
      </div>
      <SidebarContent className="px-2">
        <NavGroup label="Main" items={mainItems} />
        <NavGroup label="AI Tools" items={aiItems} />
        <NavGroup label="Tracking" items={trackItems} />
      </SidebarContent>
      <div className="mt-auto p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <p className="text-[10px] text-sidebar-foreground/50 truncate mb-2 px-1">{user.email}</p>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </Sidebar>
  );
}
