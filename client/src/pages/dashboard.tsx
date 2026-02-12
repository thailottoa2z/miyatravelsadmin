
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
import { useState } from "react";
import { IndianRupee, TrendingUp, TrendingDown, Plus, Plane, Car, FileCheck, CreditCard } from "lucide-react";
import type { CashTransaction } from "@shared/schema";

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
}

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
    enabled: ledgerOpen,
  });

  const flightsQuery = useQuery({ queryKey: ["/api/flight-bookings"] });
  const cabsQuery = useQuery({ queryKey: ["/api/cab-bookings"] });
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

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover-elevate" data-testid="card-agency-cash">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm text-muted-foreground">Agency Cash</div>
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-1" data-testid="text-cash-balance">
                  {stats ? formatINR(stats.totalBalance) : <Skeleton className="h-8 w-32" />}
                </div>
                <div className="flex gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {stats ? formatINR(stats.totalIn) : "..."}
                  </span>
                  <span className="text-xs text-red-500 flex items-center gap-1">
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
                  {(transactionsQuery.data || []).map((t) => (
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

        <Card data-testid="card-flights-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Flight Bookings</div>
              <Plane className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">{Array.isArray(flightsQuery.data) ? flightsQuery.data.length : "..."}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-cabs-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Cab Bookings</div>
              <Car className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">{Array.isArray(cabsQuery.data) ? cabsQuery.data.length : "..."}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-visa-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">Visa Applications</div>
              <FileCheck className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">{Array.isArray(visaQuery.data) ? visaQuery.data.length : "..."}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
