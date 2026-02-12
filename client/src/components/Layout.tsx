import { Link, useLocation } from "wouter";
import { 
  Plane, 
  Car, 
  CreditCard, 
  FileText, 
  Search, 
  Menu,
  LayoutDashboard
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  
  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/flights", label: "Flight Bookings", icon: Plane },
    { href: "/cabs", label: "Cab Services", icon: Car },
    { href: "/visa", label: "Visa Processing", icon: FileText },
    { href: "/cash", label: "Cash Ledger", icon: CreditCard },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
          M
        </div>
        <span className="font-display font-bold text-xl tracking-tight">Miya Travels</span>
      </div>
      
      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer
              ${location === item.href 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-medium' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="px-6 py-4 border-t border-border mt-auto">
        <div className="text-xs text-muted-foreground">System Version 1.0.0</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-border bg-card/50 backdrop-blur-xl fixed inset-y-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-40 bg-background/80 backdrop-blur border shadow-sm">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary/50 border-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
              placeholder="Global Search (Name, Passport, Phone)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white dark:ring-slate-900">
              AD
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8 space-y-8 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
