import Layout from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { 
  CreditCard, 
  Plane, 
  Car, 
  FileCheck, 
  TrendingUp, 
  Activity 
} from "lucide-react";
import { useLocation } from "wouter";
import { useCashStats } from "@/hooks/use-cash";
import { useVisaApplications } from "@/hooks/use-visa";
import { useCabBookings } from "@/hooks/use-cabs";
import { useFlightBookings } from "@/hooks/use-flights";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: cashStats } = useCashStats();
  const { data: visaApps } = useVisaApplications();
  const { data: bookings } = useCabBookings();
  const { data: flights } = useFlightBookings();

  const totalBalance = cashStats?.totalBalance || 0;
  const activeVisa = visaApps?.filter(v => v.stampingStatus !== 'completed').length || 0;
  const recentBookings = bookings?.length || 0;
  const recentFlights = flights?.length || 0;

  return (
    <Layout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Agency Cash Balance"
          value={`₹${totalBalance.toLocaleString('en-IN')}`}
          icon={<CreditCard className="w-6 h-6" />}
          trend="+12% from last month"
          trendUp={true}
          onClick={() => setLocation("/cash")}
          className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20"
        />
        
        <StatsCard
          title="Active Visa Processes"
          value={activeVisa}
          icon={<FileCheck className="w-6 h-6" />}
          trend="5 pending medical"
          onClick={() => setLocation("/visa")}
        />

        <StatsCard
          title="Cab Bookings (Total)"
          value={recentBookings}
          icon={<Car className="w-6 h-6" />}
          onClick={() => setLocation("/cabs")}
        />

        <StatsCard
          title="Flight Bookings (Total)"
          value={recentFlights}
          icon={<Plane className="w-6 h-6" />}
          onClick={() => setLocation("/flights")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Recent Activity</h3>
            <Button variant="outline" size="sm" onClick={() => setLocation("/cash")}>View Ledger</Button>
          </div>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <div className="text-center text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Activity chart requires recharts</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-semibold text-lg mb-1">Profit Margins</h3>
            <p className="text-slate-400 text-sm mb-8">This month's performance</p>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Cab Operations</span>
                  <span className="font-bold text-emerald-400">78%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[78%] rounded-full" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Visa Consulting</span>
                  <span className="font-bold text-blue-400">92%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[92%] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Flight Ticketing</span>
                  <span className="font-bold text-purple-400">45%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[45%] rounded-full" />
                </div>
              </div>
            </div>
          </div>
          
          <TrendingUp className="absolute -bottom-4 -right-4 w-48 h-48 text-white/5" />
        </div>
      </div>
    </Layout>
  );
}

import { Button } from "@/components/ui/button"; // Imported late for inline fix
