
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sun, Moon, Search } from "lucide-react";
import { useState } from "react";
import { useLocation as useWouterLocation } from "wouter";

import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import FlightBookings from "@/pages/flight-bookings";
import CabBookings from "@/pages/cab-bookings";
import CabRuns from "@/pages/cab-runs";
import CreditCards from "@/pages/credit-cards";
import Vendors from "@/pages/vendors";
import VisaApplications from "@/pages/visa-applications";
import AttestationServices from "@/pages/attestation-services";
import ServiceCalls from "@/pages/servicecalls";
import GlobalSearchResults from "@/pages/global-search";
import NotFound from "@/pages/not-found";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  );
}

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [, navigate] = useWouterLocation();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };
  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2" data-testid="form-global-search">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by Name, Phone, Passport..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 w-64"
          data-testid="input-global-search"
        />
      </div>
    </form>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/flights" component={FlightBookings} />
      <Route path="/cabs" component={CabBookings} />
      <Route path="/cab-runs" component={CabRuns} />
      <Route path="/attestation" component={AttestationServices} />
      <Route path="/credit-cards" component={CreditCards} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/visa" component={VisaApplications} />
      <Route path="/servicecalls" component={ServiceCalls} />
      <Route path="/search" component={GlobalSearchResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayoutContent() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b shrink-0 sticky top-0 z-50 bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <GlobalSearch />
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-4">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthGuard() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppLayoutContent />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <AuthGuard />
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
