
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import type { CabRun, CabBooking } from "@shared/schema";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function CabRuns() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    bookingId: "", clientName: "", advanceAmount: "0",
    startKm: "", closingKm: "",
    isReturnTrip: false, returnDate: "", returnPassengers: "", returnClientName: "", returnAdvance: "0",
    driverCollection: "0", expenseDiesel: "0", expenseToll: "0", expenseParking: "0", expenseOthers: "0", driverSalary: "0",
  });

  const query = useQuery<CabRun[]>({ queryKey: ["/api/cab-runs"] });
  const bookingsQuery = useQuery<CabBooking[]>({ queryKey: ["/api/cab-bookings"] });

  useEffect(() => {
    if (form.bookingId) {
      const booking = (bookingsQuery.data || []).find((b) => b.id === Number(form.bookingId));
      if (booking) {
        setForm((f) => ({
          ...f,
          clientName: booking.clientName,
          advanceAmount: String(booking.advanceAmount),
        }));
      }
    }
  }, [form.bookingId, bookingsQuery.data]);

  const createMut = useMutation({
    mutationFn: async () => {
      const body: any = {
        bookingId: form.bookingId ? Number(form.bookingId) : null,
        clientName: form.clientName || null,
        advanceAmount: form.advanceAmount || "0",
        startKm: form.startKm ? Number(form.startKm) : null,
        closingKm: form.closingKm ? Number(form.closingKm) : null,
        isReturnTrip: form.isReturnTrip,
        returnDate: form.returnDate || null,
        returnPassengers: form.returnPassengers ? Number(form.returnPassengers) : null,
        returnClientName: form.returnClientName || null,
        returnAdvance: form.returnAdvance || "0",
        driverCollection: form.driverCollection || "0",
        expenseDiesel: form.expenseDiesel || "0",
        expenseToll: form.expenseToll || "0",
        expenseParking: form.expenseParking || "0",
        expenseOthers: form.expenseOthers || "0",
        driverSalary: form.driverSalary || "0",
      };
      await apiRequest("POST", "/api/cab-runs", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cab-runs"] });
      setOpen(false);
      setForm({ bookingId: "", clientName: "", advanceAmount: "0", startKm: "", closingKm: "", isReturnTrip: false, returnDate: "", returnPassengers: "", returnClientName: "", returnAdvance: "0", driverCollection: "0", expenseDiesel: "0", expenseToll: "0", expenseParking: "0", expenseOthers: "0", driverSalary: "0" });
      toast({ title: "Cab run created" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const setField = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const onwardAdv = Number(form.advanceAmount || 0);
  const returnAdv = Number(form.returnAdvance || 0);
  const driverCol = Number(form.driverCollection || 0);
  const totalCollection = onwardAdv + returnAdv + driverCol;
  const totalExpenses = Number(form.expenseDiesel || 0) + Number(form.expenseToll || 0) + Number(form.expenseParking || 0) + Number(form.expenseOthers || 0) + Number(form.driverSalary || 0);
  const totalProfit = totalCollection - totalExpenses;
  const margin = totalCollection - onwardAdv - returnAdv - totalExpenses;
  const totalKm = (Number(form.closingKm || 0) - Number(form.startKm || 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Cab Runs</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-run"><Plus className="w-4 h-4 mr-1" /> New Cab Run</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>New Cab Run</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-4">
              <div>
                <Label>Link to Booking (Optional)</Label>
                <Select value={form.bookingId} onValueChange={(v) => { if (v === "none") { setField("bookingId", ""); } else { setField("bookingId", v); } }}>
                  <SelectTrigger data-testid="select-run-booking"><SelectValue placeholder="Select booking or enter manually" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Enter Manually --</SelectItem>
                    {(bookingsQuery.data || []).map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.clientName} - {b.travelDate}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} placeholder="Enter client name" required data-testid="input-run-client-name" /></div>
              <div><Label>Advance Amount (INR)</Label><Input type="number" value={form.advanceAmount} onChange={(e) => setField("advanceAmount", e.target.value)} data-testid="input-run-advance" /></div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start KM</Label><Input type="number" value={form.startKm} onChange={(e) => setField("startKm", e.target.value)} data-testid="input-run-start-km" /></div>
                <div><Label>Closing KM</Label><Input type="number" value={form.closingKm} onChange={(e) => setField("closingKm", e.target.value)} data-testid="input-run-closing-km" /></div>
              </div>
              {(form.startKm || form.closingKm) && <div className="text-sm text-muted-foreground">Total Distance: {totalKm > 0 ? totalKm : 0} km</div>}

              <div className="flex items-center gap-2">
                <Switch checked={form.isReturnTrip} onCheckedChange={(v) => setField("isReturnTrip", v)} data-testid="switch-return-trip" />
                <Label>Return Trip</Label>
              </div>

              {form.isReturnTrip && (
                <Card>
                  <CardContent className="p-3 space-y-3">
                    <div className="font-medium text-sm">Return Trip Details</div>
                    <div><Label>Return Date</Label><Input type="date" value={form.returnDate} onChange={(e) => setField("returnDate", e.target.value)} data-testid="input-run-return-date" /></div>
                    <div><Label>No. of Passengers</Label><Input type="number" value={form.returnPassengers} onChange={(e) => setField("returnPassengers", e.target.value)} data-testid="input-run-return-pax" /></div>
                    <div><Label>Return Client Name</Label><Input value={form.returnClientName} onChange={(e) => setField("returnClientName", e.target.value)} data-testid="input-run-return-client" /></div>
                    <div><Label>Return Advance</Label><Input type="number" value={form.returnAdvance} onChange={(e) => setField("returnAdvance", e.target.value)} data-testid="input-run-return-advance" /></div>
                  </CardContent>
                </Card>
              )}

              <div><Label>Driver Collection</Label><Input type="number" value={form.driverCollection} onChange={(e) => setField("driverCollection", e.target.value)} data-testid="input-run-driver-collection" /></div>

              <Card>
                <CardContent className="p-3 space-y-3">
                  <div className="font-medium text-sm">Expenses</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Diesel</Label><Input type="number" value={form.expenseDiesel} onChange={(e) => setField("expenseDiesel", e.target.value)} data-testid="input-run-diesel" /></div>
                    <div><Label>Toll</Label><Input type="number" value={form.expenseToll} onChange={(e) => setField("expenseToll", e.target.value)} data-testid="input-run-toll" /></div>
                    <div><Label>Parking</Label><Input type="number" value={form.expenseParking} onChange={(e) => setField("expenseParking", e.target.value)} data-testid="input-run-parking" /></div>
                    <div><Label>Others</Label><Input type="number" value={form.expenseOthers} onChange={(e) => setField("expenseOthers", e.target.value)} data-testid="input-run-others" /></div>
                  </div>
                  <div><Label>Driver Salary</Label><Input type="number" value={form.driverSalary} onChange={(e) => setField("driverSalary", e.target.value)} data-testid="input-run-salary" /></div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 space-y-1">
                  <div className="font-medium text-sm mb-2">Summary</div>
                  <div className="flex justify-between text-sm"><span>Total Collection</span><span className="font-medium">{formatINR(totalCollection)}</span></div>
                  <div className="flex justify-between text-sm"><span>Total Expenses</span><span className="font-medium">{formatINR(totalExpenses)}</span></div>
                  <div className="flex justify-between text-sm font-semibold"><span>Total Profit</span><span>{formatINR(totalProfit)}</span></div>
                  <div className="flex justify-between text-sm"><span>Margin (Driver Handover)</span><span className="font-medium">{formatINR(margin)}</span></div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={createMut.isPending} data-testid="button-submit-run">{createMut.isPending ? "Saving..." : "Create Cab Run"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {query.isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>KM</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data || []).map((r) => {
                  const booking = r.bookingId ? (bookingsQuery.data || []).find((b) => b.id === r.bookingId) : null;
                  const name = r.clientName || booking?.clientName || `#${r.bookingId || "?"}`;
                  const adv = Number(r.advanceAmount || booking?.advanceAmount || 0);
                  const col = adv + Number(r.returnAdvance || 0) + Number(r.driverCollection || 0);
                  const exp = Number(r.expenseDiesel || 0) + Number(r.expenseToll || 0) + Number(r.expenseParking || 0) + Number(r.expenseOthers || 0) + Number(r.driverSalary || 0);
                  const km = (r.closingKm && r.startKm) ? r.closingKm - r.startKm : null;
                  return (
                    <TableRow key={r.id} data-testid={`row-run-${r.id}`}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{formatINR(adv)}</TableCell>
                      <TableCell>{km !== null ? `${km} km` : "-"}</TableCell>
                      <TableCell>{r.isReturnTrip ? `${r.returnClientName || "Yes"}` : "No"}</TableCell>
                      <TableCell>{formatINR(col)}</TableCell>
                      <TableCell>{formatINR(exp)}</TableCell>
                      <TableCell className="font-medium">{formatINR(col - exp)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : ""}</TableCell>
                    </TableRow>
                  );
                })}
                {(query.data || []).length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No cab runs yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
