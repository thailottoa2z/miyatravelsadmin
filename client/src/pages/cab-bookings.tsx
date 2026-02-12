
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
import { Plus } from "lucide-react";
import type { Vehicle, Vendor, CabBookingWithVehicle } from "@shared/schema";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function CabBookings() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [addPlateOpen, setAddPlateOpen] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [form, setForm] = useState({ clientName: "", clientPhone: "", travelDate: "", pickupLocation: "", dropLocation: "", vehicleId: "", totalAmount: "", advanceAmount: "0", paymentMode: "Cash", vendorId: "" });

  const query = useQuery<CabBookingWithVehicle[]>({ queryKey: ["/api/cab-bookings"] });
  const vehiclesQuery = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const vendorsQuery = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });

  const createMut = useMutation({
    mutationFn: async () => {
      const body: any = { ...form, vehicleId: Number(form.vehicleId) || null, totalAmount: form.totalAmount, advanceAmount: form.advanceAmount || "0" };
      if (form.paymentMode !== "Credit/Pay Later") { body.vendorId = null; } else { body.vendorId = Number(form.vendorId) || null; }
      await apiRequest("POST", "/api/cab-bookings", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cab-bookings"] });
      setOpen(false);
      setForm({ clientName: "", clientPhone: "", travelDate: "", pickupLocation: "", dropLocation: "", vehicleId: "", totalAmount: "", advanceAmount: "0", paymentMode: "Cash", vendorId: "" });
      toast({ title: "Cab booking created" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const addPlateMut = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/vehicles", { carNumber: newPlate.toUpperCase() }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setAddPlateOpen(false);
      setNewPlate("");
      toast({ title: "Vehicle added" });
    },
    onError: () => toast({ title: "Duplicate or invalid plate", variant: "destructive" }),
  });

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Cab Bookings</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-cab"><Plus className="w-4 h-4 mr-1" /> New Booking</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>New Cab Booking</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-3">
              <div><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} required data-testid="input-cab-client" /></div>
              <div><Label>Client Phone</Label><Input value={form.clientPhone} onChange={(e) => setField("clientPhone", e.target.value)} required data-testid="input-cab-phone" /></div>
              <div><Label>Travel Date</Label><Input type="date" value={form.travelDate} onChange={(e) => setField("travelDate", e.target.value)} required data-testid="input-cab-date" /></div>
              <div><Label>Pickup Location</Label><Input value={form.pickupLocation} onChange={(e) => setField("pickupLocation", e.target.value)} required data-testid="input-cab-pickup" /></div>
              <div><Label>Drop Location</Label><Input value={form.dropLocation} onChange={(e) => setField("dropLocation", e.target.value)} required data-testid="input-cab-drop" /></div>
              <div>
                <Label>Vehicle (Car Number)</Label>
                <Select value={form.vehicleId} onValueChange={(v) => { if (v === "add-new") { setAddPlateOpen(true); } else { setField("vehicleId", v); } }}>
                  <SelectTrigger data-testid="select-cab-vehicle"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {(vehiclesQuery.data || []).map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.carNumber}</SelectItem>)}
                    <SelectItem value="add-new">+ Add New Plate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Total Amount (INR)</Label><Input type="number" value={form.totalAmount} onChange={(e) => setField("totalAmount", e.target.value)} required data-testid="input-cab-total" /></div>
              <div><Label>Advance Amount (INR)</Label><Input type="number" value={form.advanceAmount} onChange={(e) => setField("advanceAmount", e.target.value)} data-testid="input-cab-advance" /></div>
              <div className="text-sm text-muted-foreground">Pending: {formatINR(Math.max(0, Number(form.totalAmount || 0) - Number(form.advanceAmount || 0)))}</div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={(v) => setField("paymentMode", v)}>
                  <SelectTrigger data-testid="select-cab-payment"><SelectValue /></SelectTrigger>
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
                    <SelectTrigger data-testid="select-cab-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>{(vendorsQuery.data || []).map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={createMut.isPending} data-testid="button-submit-cab">{createMut.isPending ? "Saving..." : "Create Booking"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={addPlateOpen} onOpenChange={setAddPlateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Vehicle Plate</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addPlateMut.mutate(); }} className="space-y-3">
            <div><Label>Car Number</Label><Input value={newPlate} onChange={(e) => setNewPlate(e.target.value.toUpperCase())} placeholder="AP39WK6292" required data-testid="input-new-plate" style={{ textTransform: "uppercase" }} /></div>
            <Button type="submit" disabled={addPlateMut.isPending} data-testid="button-submit-plate">{addPlateMut.isPending ? "Adding..." : "Add Plate"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {query.isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Drop</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data || []).map((b) => (
                  <TableRow key={b.id} data-testid={`row-cab-${b.id}`}>
                    <TableCell className="font-medium">{b.clientName}</TableCell>
                    <TableCell data-testid={`text-cab-phone-${b.id}`}>{b.clientPhone}</TableCell>
                    <TableCell>{b.travelDate}</TableCell>
                    <TableCell>{b.pickupLocation}</TableCell>
                    <TableCell>{b.dropLocation}</TableCell>
                    <TableCell>{b.vehicle?.carNumber || "-"}</TableCell>
                    <TableCell>{formatINR(Number(b.totalAmount))}</TableCell>
                    <TableCell>{formatINR(Number(b.advanceAmount))}</TableCell>
                    <TableCell className="font-medium">{formatINR(Number(b.totalAmount) - Number(b.advanceAmount))}</TableCell>
                  </TableRow>
                ))}
                {(query.data || []).length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No cab bookings yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
