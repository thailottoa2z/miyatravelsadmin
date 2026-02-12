
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { IndianRupee, TrendingUp, TrendingDown, Plus, Plane, Car, FileCheck, CreditCard as CreditCardIcon, LayoutDashboard, AlertTriangle, Calendar, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import type { CashTransaction, FlightBooking, CabBooking } from "@shared/schema";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
}

function formatINRShort(val: number) {
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(val);
}

function getMonthLabel(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function getMonthKey(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "1970-01";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const CHART_COLORS = {
  inflow: "hsl(142, 71%, 45%)",
  outflow: "hsl(0, 84%, 60%)",
  flights: "hsl(217, 91%, 60%)",
  cabs: "hsl(38, 92%, 50%)",
  flightRevenue: "hsl(217, 91%, 60%)",
  cabRevenue: "hsl(38, 92%, 50%)",
  attestation: "hsl(172, 66%, 50%)",
  pending: "hsl(25, 95%, 53%)",
};

export default function Dashboard() {
  const { toast } = useToast();
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [type, setType] = useState<"in" | "out">("in");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const statsQuery = useQuery<{ totalBalance: number; totalIn: number; totalOut: number }>({
    queryKey: ["/api/cash-stats"],
  });

  const transactionsQuery = useQuery<CashTransaction[]>({
    queryKey: ["/api/cash-transactions"],
  });

  const flightsQuery = useQuery<FlightBooking[]>({ queryKey: ["/api/flight-bookings"] });
  const cabsQuery = useQuery<(CabBooking & { vehicle: any })[]>({ queryKey: ["/api/cab-bookings"] });
  const visaQuery = useQuery({ queryKey: ["/api/visa-applications"] });
  const cardsQuery = useQuery({ queryKey: ["/api/credit-cards"] });

  const addMutation = useMutation({
    mutationFn: async (data: { type: string; personName: string; amount: string; reason: string }) => {
      await apiRequest("POST", "/api/cash-transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-stats"] });
      setAddEntryOpen(false);
      setPersonName(""); setAmount(""); setReason("");
      toast({ title: "Entry added" });
    },
  });

  const [, navigate] = useLocation();
  const stats = statsQuery.data;
  const transactions = transactionsQuery.data || [];
  const flights = flightsQuery.data || [];
  const cabs = cabsQuery.data || [];

  const cashFlowData = useMemo(() => {
    if (!transactions.length) return [];
    const monthMap: Record<string, { month: string; monthKey: string; inflow: number; outflow: number }> = {};
    transactions.forEach((t) => {
      const key = getMonthKey(t.createdAt);
      const label = getMonthLabel(t.createdAt);
      if (!monthMap[key]) monthMap[key] = { month: label, monthKey: key, inflow: 0, outflow: 0 };
      if (t.type === "in") monthMap[key].inflow += Number(t.amount);
      else monthMap[key].outflow += Number(t.amount);
    });
    return Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey)).slice(-6);
  }, [transactions]);

  const bookingsData = useMemo(() => {
    const monthMap: Record<string, { month: string; monthKey: string; flights: number; cabs: number }> = {};
    flights.forEach((f) => {
      const key = getMonthKey(f.createdAt);
      const label = getMonthLabel(f.createdAt);
      if (!monthMap[key]) monthMap[key] = { month: label, monthKey: key, flights: 0, cabs: 0 };
      monthMap[key].flights++;
    });
    cabs.forEach((c) => {
      const key = getMonthKey(c.createdAt);
      const label = getMonthLabel(c.createdAt);
      if (!monthMap[key]) monthMap[key] = { month: label, monthKey: key, flights: 0, cabs: 0 };
      monthMap[key].cabs++;
    });
    return Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey)).slice(-6);
  }, [flights, cabs]);

  const revenueBreakdown = useMemo(() => {
    const flightTotal = flights.reduce((sum, f) => sum + Number(f.totalAmount), 0);
    const cabTotal = cabs.reduce((sum, c) => sum + Number(c.totalAmount), 0);
    const data = [];
    if (flightTotal > 0) data.push({ name: "Flights", value: flightTotal, color: CHART_COLORS.flightRevenue });
    if (cabTotal > 0) data.push({ name: "Cabs", value: cabTotal, color: CHART_COLORS.cabRevenue });
    return data;
  }, [flights, cabs]);

  const analysisStats = useMemo(() => {
    const flightRevenue = flights.reduce((sum, f) => sum + Number(f.totalAmount), 0);
    const flightAdvance = flights.reduce((sum, f) => sum + Number(f.advancePaid || 0), 0);
    const flightPending = flightRevenue - flightAdvance;

    const cabRevenue = cabs.reduce((sum, c) => sum + Number(c.totalAmount), 0);
    const cabAdvance = cabs.reduce((sum, c) => sum + Number(c.advanceAmount || 0), 0);
    const cabPending = cabRevenue - cabAdvance;

    const totalRevenue = flightRevenue + cabRevenue;
    const totalPending = flightPending + cabPending;
    const totalCollected = flightAdvance + cabAdvance;

    const upcomingFlights = flights.filter((f) => {
      const travelDate = new Date(f.travelDate);
      const now = new Date();
      const diffDays = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    const upcomingCabs = cabs.filter((c) => {
      const travelDate = new Date(c.travelDate);
      const now = new Date();
      const diffDays = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    return {
      totalRevenue, totalPending, totalCollected,
      flightRevenue, cabRevenue,
      flightPending, cabPending,
      upcomingFlights, upcomingCabs,
    };
  }, [flights, cabs]);

  const isChartsLoading = transactionsQuery.isLoading || flightsQuery.isLoading || cabsQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover-elevate" data-testid="card-agency-cash">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm text-muted-foreground">Agency Cash</div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-500/10 dark:bg-green-400/10">
                    <IndianRupee className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold mt-1" data-testid="text-cash-balance">
                  {stats ? formatINR(stats.totalBalance) : <Skeleton className="h-8 w-32" />}
                </div>
                <div className="flex gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {stats ? formatINR(stats.totalIn) : "..."}
                  </span>
                  <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> {stats ? formatINR(stats.totalOut) : "..."}
                  </span>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Agency Cash Ledger</DialogTitle>
            </DialogHeader>
            <div className="flex justify-end mb-4">
              <Dialog open={addEntryOpen} onOpenChange={setAddEntryOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-cash-entry"><Plus className="w-4 h-4 mr-1" /> Add Entry</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Cash Entry</DialogTitle></DialogHeader>
                  <form
                    onSubmit={(e) => { e.preventDefault(); addMutation.mutate({ type, personName, amount, reason }); }}
                    className="space-y-4"
                  >
                    <div>
                      <Label>Transaction Type</Label>
                      <Select value={type} onValueChange={(v) => setType(v as "in" | "out")}>
                        <SelectTrigger data-testid="select-cash-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">In (Cash Added)</SelectItem>
                          <SelectItem value="out">Out (Cash Removed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Person Name</Label><Input value={personName} onChange={(e) => setPersonName(e.target.value)} required data-testid="input-cash-person" /></div>
                    <div><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required data-testid="input-cash-amount" /></div>
                    <div><Label>Reason / Purpose</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} required data-testid="input-cash-reason" /></div>
                    <Button type="submit" disabled={addMutation.isPending} data-testid="button-submit-cash-entry">
                      {addMutation.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {transactionsQuery.isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id} data-testid={`row-cash-${t.id}`}>
                      <TableCell>
                        <Badge variant={t.type === "in" ? "default" : "destructive"}>
                          {t.type === "in" ? "IN" : "OUT"}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.personName}</TableCell>
                      <TableCell>{formatINR(Number(t.amount))}</TableCell>
                      <TableCell>{t.reason}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>

        <Card className="cursor-pointer hover-elevate" data-testid="card-flights-count" onClick={() => navigate('/flights')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Flight Bookings</div>
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/10 dark:bg-blue-400/10">
                <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-1">{Array.isArray(flightsQuery.data) ? flightsQuery.data.length : "..."}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover-elevate" data-testid="card-cabs-count" onClick={() => navigate('/cabs')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Cab Bookings</div>
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500/10 dark:bg-amber-400/10">
                <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-1">{Array.isArray(cabsQuery.data) ? cabsQuery.data.length : "..."}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover-elevate" data-testid="card-visa-count" onClick={() => navigate('/visa')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Visa Applications</div>
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-500/10 dark:bg-emerald-400/10">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-1">{Array.isArray(visaQuery.data) ? visaQuery.data.length : "..."}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-revenue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-1" data-testid="text-total-revenue">
              {isChartsLoading ? <Skeleton className="h-8 w-32" /> : formatINR(analysisStats.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">From all bookings</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-collected">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Total Collected</div>
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-500/10 dark:bg-green-400/10">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400" data-testid="text-total-collected">
              {isChartsLoading ? <Skeleton className="h-8 w-32" /> : formatINR(analysisStats.totalCollected)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Advances received</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-pending">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Total Pending</div>
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-500/10 dark:bg-orange-400/10">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400" data-testid="text-total-pending">
              {isChartsLoading ? <Skeleton className="h-8 w-32" /> : formatINR(analysisStats.totalPending)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Yet to collect</div>
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Upcoming (7 days)</div>
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-violet-500/10 dark:bg-violet-400/10">
                <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-1" data-testid="text-upcoming-count">
              {isChartsLoading ? <Skeleton className="h-8 w-32" /> : (analysisStats.upcomingFlights + analysisStats.upcomingCabs)}
            </div>
            <div className="flex gap-3 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">{analysisStats.upcomingFlights} flights</span>
              <span className="text-xs text-muted-foreground">{analysisStats.upcomingCabs} cabs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="chart-cash-flow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Cash Inflow vs Outflow</CardTitle>
          </CardHeader>
          <CardContent>
            {isChartsLoading ? (
              <Skeleton className="h-64" />
            ) : cashFlowData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No transaction data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashFlowData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tickFormatter={(v) => formatINRShort(v)} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => formatINR(value)}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="inflow" name="Inflow" fill={CHART_COLORS.inflow} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" name="Outflow" fill={CHART_COLORS.outflow} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="chart-bookings">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Bookings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isChartsLoading ? (
              <Skeleton className="h-64" />
            ) : bookingsData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No booking data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={bookingsData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="flights" name="Flights" stroke={CHART_COLORS.flights} fill={CHART_COLORS.flights} fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="cabs" name="Cabs" stroke={CHART_COLORS.cabs} fill={CHART_COLORS.cabs} fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card data-testid="chart-revenue-breakdown">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isChartsLoading ? (
              <Skeleton className="h-52" />
            ) : revenueBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No revenue data yet</div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatINR(value)}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 flex-wrap justify-center mt-2">
                  {revenueBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}: {formatINR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-payment-analysis">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Payment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {isChartsLoading ? (
              <Skeleton className="h-52" />
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">Flight Bookings</span>
                    </div>
                    <span className="text-sm font-medium" data-testid="text-flight-revenue">{formatINR(analysisStats.flightRevenue)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${analysisStats.flightRevenue > 0 ? Math.max(5, ((analysisStats.flightRevenue - analysisStats.flightPending) / analysisStats.flightRevenue) * 100) : 0}%`,
                        backgroundColor: CHART_COLORS.flights,
                      }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>Collected: <span className="text-green-600 dark:text-green-400 font-medium">{formatINR(analysisStats.flightRevenue - analysisStats.flightPending)}</span></span>
                    <span>Pending: <span className="text-orange-600 dark:text-orange-400 font-medium">{formatINR(analysisStats.flightPending)}</span></span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium">Cab Bookings</span>
                    </div>
                    <span className="text-sm font-medium" data-testid="text-cab-revenue">{formatINR(analysisStats.cabRevenue)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${analysisStats.cabRevenue > 0 ? Math.max(5, ((analysisStats.cabRevenue - analysisStats.cabPending) / analysisStats.cabRevenue) * 100) : 0}%`,
                        backgroundColor: CHART_COLORS.cabs,
                      }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>Collected: <span className="text-green-600 dark:text-green-400 font-medium">{formatINR(analysisStats.cabRevenue - analysisStats.cabPending)}</span></span>
                    <span>Pending: <span className="text-orange-600 dark:text-orange-400 font-medium">{formatINR(analysisStats.cabPending)}</span></span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium">Overall Collection Rate</span>
                    <span className="text-sm font-bold" data-testid="text-collection-rate">
                      {analysisStats.totalRevenue > 0
                        ? `${Math.round((analysisStats.totalCollected / analysisStats.totalRevenue) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
