import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import CashLedger from "@/pages/CashLedger";
import Flights from "@/pages/Flights";
import Cabs from "@/pages/Cabs";
import Visa from "@/pages/Visa";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/cash" component={CashLedger} />
      <Route path="/flights" component={Flights} />
      <Route path="/cabs" component={Cabs} />
      <Route path="/visa" component={Visa} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
