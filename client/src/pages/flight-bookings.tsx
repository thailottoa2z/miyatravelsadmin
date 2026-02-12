
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { FlightBooking, Vendor } from "@shared/schema";

const PLATFORMS = ["MakeMyTrip", "Goibibo", "Cleartrip", "Via.com", "Akbar Travels", "Others"];

export default function FlightBookings() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ clientName: "", clientPhone: "", sector: "", travelDate: "", airline: "", platform: "", platformNotes: "", totalAmount: "", paymentMode: "Cash", vendorId: "" });

  const query = useQuery<FlightBooking[]>({ queryKey: ["/api/flight-bookings"] });
  const vendorsQuery = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });

  const createMut = useMutation({
    mutationFn: async () => {
      const body: any = { ...form, totalAmount: form.totalAmount };
      if (form.platform !== "Others") body.platformNotes = null;
      if (form.paymentMode !== "Credit/Pay Later") { body.vendorId = null; } else { body.vendorId = Number(form.vendorId) || null; }
      await apiRequest("POST", "/api/flight-bookings", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flight-bookings"] });
      setOpen(false);
      setForm({ clientName: "", clientPhone: "", sector: "", travelDate: "", airline: "", platform: "", platformNotes: "", totalAmount: "", paymentMode: "Cash", vendorId: "" });
      toast({ title: "Flight booking created" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/flight-bookings/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/flight-bookings"] }); },
  });

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Flight Bookings</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-flight"><Plus className="w-4 h-4 mr-1" /> New Booking</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>New Flight Booking</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-3">
              <div><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} required data-testid="input-flight-client" /></div>
              <div><Label>Contact Number</Label><Input value={form.clientPhone} onChange={(e) => setField("clientPhone", e.target.value)} required data-testid="input-flight-phone" /></div>
              <div><Label>Sector</Label><Input value={form.sector} onChange={(e) => setField("sector", e.target.value)} placeholder="HYD-DEL" required data-testid="input-flight-sector" /></div>
              <div><Label>Travel Date</Label><Input type="date" value={form.travelDate} onChange={(e) => setField("travelDate", e.target.value)} required data-testid="input-flight-date" /></div>
              <div><Label>Airline</Label><Input value={form.airline} onChange={(e) => setField("airline", e.target.value)} required data-testid="input-flight-airline" /></div>
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setField("platform", v)}>
                  <SelectTrigger data-testid="select-flight-platform"><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.platform === "Others" && (
                <div><Label>Platform Notes</Label><Input value={form.platformNotes} onChange={(e) => setField("platformNotes", e.target.value)} placeholder="Enter platform name" data-testid="input-flight-platform-notes" /></div>
              )}
              <div><Label>Total Amount (INR)</Label><Input type="number" value={form.totalAmount} onChange={(e) => setField("totalAmount", e.target.value)} required data-testid="input-flight-amount" /></div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={(v) => setField("paymentMode", v)}>
                  <SelectTrigger data-testid="select-flight-payment"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit/Pay Later">Credit/Pay Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.paymentMode === "Credit/Pay Later" && (
                <div>
                  <Label>Select Vendor</Label>
                  <Select value={form.vendorId} onValueChange={(v) => setField("vendorId", v)}>
                    <SelectTrigger data-testid="select-flight-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      {(vendorsQuery.data || []).map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={createMut.isPending} data-testid="button-submit-flight">{createMut.isPending ? "Saving..." : "Create Booking"}</Button>
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
                  <TableHead>Phone</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Airline</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data || []).map((f) => (
                  <TableRow key={f.id} data-testid={`row-flight-${f.id}`}>
                    <TableCell className="font-medium">{f.clientName}</TableCell>
                    <TableCell data-testid={`text-flight-phone-${f.id}`}>{f.clientPhone}</TableCell>
                    <TableCell>{f.sector}</TableCell>
                    <TableCell>{f.travelDate}</TableCell>
                    <TableCell>{f.airline}</TableCell>
                    <TableCell>{f.platform === "Others" ? f.platformNotes || "Others" : f.platform}</TableCell>
                    <TableCell className="font-medium">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(f.totalAmount))}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(f.id)} data-testid={`button-delete-flight-${f.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(query.data || []).length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No flight bookings yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
