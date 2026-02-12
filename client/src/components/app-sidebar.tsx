
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Flight Bookings", url: "/flights", icon: Plane },
  { title: "Cab Bookings", url: "/cabs", icon: Car },
  { title: "Cab Runs", url: "/cab-runs", icon: Route },
  { title: "Attestation", url: "/attestation", icon: Stamp },
  { title: "Credit Cards", url: "/credit-cards", icon: CreditCard },
  { title: "Vendors", url: "/vendors", icon: Users },
  { title: "Work Visa", url: "/visa", icon: FileCheck },
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
                      <item.icon />
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
