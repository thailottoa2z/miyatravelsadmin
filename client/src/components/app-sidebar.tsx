
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Plane, Car, Route, CreditCard, Users, FileCheck, Stamp, PhoneCall, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, color: "text-sidebar-primary" },
  { title: "Flight Bookings", url: "/flights", icon: Plane, color: "text-blue-500 dark:text-blue-400" },
  { title: "Cab Bookings", url: "/cabs", icon: Car, color: "text-amber-500 dark:text-amber-400" },
  { title: "Cab Runs", url: "/cab-runs", icon: Route, color: "text-orange-500 dark:text-orange-400" },
  { title: "Attestation", url: "/attestation", icon: Stamp, color: "text-teal-500 dark:text-teal-400" },
  { title: "Credit Cards", url: "/credit-cards", icon: CreditCard, color: "text-violet-500 dark:text-violet-400" },
  { title: "Vendors", url: "/vendors", icon: Users, color: "text-rose-500 dark:text-rose-400" },
  { title: "Work Visa", url: "/visa", icon: FileCheck, color: "text-emerald-500 dark:text-emerald-400" },
  { title: "Service Calls", url: "/servicecalls", icon: PhoneCall, color: "text-indigo-500 dark:text-indigo-400" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar className="flex flex-col">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img
            src="https://miyatravels.com/logo.png"
            alt="MiyaTravels Logo"
            className="h-8 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <div className="font-semibold text-sm" data-testid="text-brand-name">Miya Travels</div>
            <div className="text-xs text-muted-foreground">Agency Management</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1">
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
      <SidebarFooter className="p-4 border-t">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
