
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
import { LayoutDashboard, Plane, Car, Route, CreditCard, Users, FileCheck, Stamp } from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, color: "text-sidebar-primary" },
  { title: "Flight Bookings", url: "/flights", icon: Plane, color: "text-blue-500 dark:text-blue-400" },
  { title: "Cab Bookings", url: "/cabs", icon: Car, color: "text-amber-500 dark:text-amber-400" },
  { title: "Cab Runs", url: "/cab-runs", icon: Route, color: "text-orange-500 dark:text-orange-400" },
  { title: "Attestation", url: "/attestation", icon: Stamp, color: "text-teal-500 dark:text-teal-400" },
  { title: "Credit Cards", url: "/credit-cards", icon: CreditCard, color: "text-violet-500 dark:text-violet-400" },
  { title: "Vendors", url: "/vendors", icon: Users, color: "text-rose-500 dark:text-rose-400" },
  { title: "Work Visa", url: "/visa", icon: FileCheck, color: "text-emerald-500 dark:text-emerald-400" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold text-sm">
            MT
          </div>
          <div>
            <div className="font-semibold text-sm" data-testid="text-brand-name">Miya Travels</div>
            <div className="text-xs text-muted-foreground">Agency Management</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link href={item.url}>
                      <item.icon className={item.color} />
                      <span>{item.title}</span>
                    </Link>
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
