
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, AlertTriangle, Car } from "lucide-react";
import type { Vehicle, Vendor, CabBookingWithVehicle } from "@shared/schema";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const emptyForm = { clientName: "", clientPhone: "", referenceName: "", referencePhone: "", travelDate: "", pickupLocation: "", dropLocation: "", vehicleId: "", totalAmount: "", advanceAmount: "0", paymentMode: "Cash", vendorId: "" };

export default function CabBookings() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [addPlateOpen, setAddPlateOpen] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [form, setForm] = useState({ ...emptyForm });
  const [detailBooking, setDetailBooking] = useState<CabBookingWithVehicle | null>(null);

  const query = useQuery<CabBookingWithVehicle[]>({ queryKey: ["/api/cab-bookings"] });
  const vehiclesQuery = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const vendorsQuery = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });

  const upcomingCabs = useMemo(() => {
    if (!query.data) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    return query.data.filter((b) => {
      const td = new Date(b.travelDate);
      td.setHours(0, 0, 0, 0);
      return td >= today && td <= twoDaysLater;
    });
  }, [query.data]);

  const createMut = useMutation({
    mutationFn: async () => {
      const body: any = { ...form, vehicleId: Number(form.vehicleId) || null, totalAmount: form.totalAmount, advanceAmount: form.advanceAmount || "0" };
      if (form.paymentMode !== "Credit/Pay Later") { body.vendorId = null; } else { body.vendorId = Number(form.vendorId) || null; }
      if (!body.referenceName) body.referenceName = null;
      if (!body.referencePhone) body.referencePhone = null;
      body.reminderDate = null;
      body.reminderNote = null;
      await apiRequest("POST", "/api/cab-bookings", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cab-bookings"] });
      setOpen(false);
      setForm({ ...emptyForm });
      toast({ title: "Cab booking created" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      const body: any = { ...form, vehicleId: Number(form.vehicleId) || null, totalAmount: form.totalAmount, advanceAmount: form.advanceAmount || "0" };
      if (form.paymentMode !== "Credit/Pay Later") { body.vendorId = null; } else { body.vendorId = Number(form.vendorId) || null; }
      if (!body.referenceName) body.referenceName = null;
      if (!body.referencePhone) body.referencePhone = null;
      body.reminderDate = null;
      body.reminderNote = null;
      await apiRequest("PUT", `/api/cab-bookings/${editId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cab-bookings"] });
      setEditOpen(false);
      setEditId(null);
      setForm({ ...emptyForm });
      toast({ title: "Cab booking updated" });
    },
    onError: () => toast({ title: "Error updating", variant: "destructive" }),
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

  const openEdit = (b: CabBookingWithVehicle) => {
    setEditId(b.id);
    setForm({
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      referenceName: b.referenceName || "",
      referencePhone: b.referencePhone || "",
      travelDate: b.travelDate,
      pickupLocation: b.pickupLocation,
      dropLocation: b.dropLocation,
      vehicleId: b.vehicleId ? String(b.vehicleId) : "",
      totalAmount: String(b.totalAmount),
      advanceAmount: String(b.advanceAmount),
      paymentMode: b.paymentMode || "Cash",
      vendorId: b.vendorId ? String(b.vendorId) : "",
    });
    setEditOpen(true);
  };

  const formFields = (isEdit: boolean) => (
    <form onSubmit={(e) => { e.preventDefault(); isEdit ? updateMut.mutate() : createMut.mutate(); }} className="space-y-3">
      <div><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} required data-testid="input-cab-client" /></div>
      <div><Label>Client Phone</Label><Input value={form.clientPhone} onChange={(e) => setField("clientPhone", e.target.value)} required data-testid="input-cab-phone" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Reference Name</Label><Input value={form.referenceName} onChange={(e) => setField("referenceName", e.target.value)} placeholder="Optional" data-testid="input-cab-ref-name" /></div>
        <div><Label>Reference Number</Label><Input value={form.referencePhone} onChange={(e) => setField("referencePhone", e.target.value)} placeholder="Optional" data-testid="input-cab-ref-phone" /></div>
      </div>
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
      <Button type="submit" disabled={isEdit ? updateMut.isPending : createMut.isPending} data-testid="button-submit-cab">
        {(isEdit ? updateMut.isPending : createMut.isPending) ? "Saving..." : isEdit ? "Update Booking" : "Create Booking"}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      {upcomingCabs.length > 0 && (
        <div className="space-y-2">
          {upcomingCabs.map((b) => (
            <Card key={`alert-${b.id}`}>
              <CardContent className="flex items-center gap-3 p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">{b.clientName}</span> - Cab on <span className="font-medium">{b.travelDate}</span> ({b.pickupLocation} to {b.dropLocation})
                </div>
                <Badge variant="outline" className="ml-auto shrink-0">Upcoming</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-amber-500/10 dark:bg-amber-400/10">
            <Car className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Cab Bookings</h1>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm({ ...emptyForm }); }}>
          <DialogTrigger asChild><Button data-testid="button-add-cab"><Plus className="w-4 h-4 mr-1" /> New Booking</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>New Cab Booking</DialogTitle></DialogHeader>
            {formFields(false)}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { setEditId(null); setForm({ ...emptyForm }); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>Edit Cab Booking</DialogTitle></DialogHeader>
          {formFields(true)}
        </DialogContent>
      </Dialog>

      <Dialog open={addPlateOpen} onOpenChange={setAddPlateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Vehicle Plate</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addPlateMut.mutate(); }} className="space-y-3">
            <div><Label>Car Number</Label><Input value={newPlate} onChange={(e) => setNewPlate(e.target.value.toUpperCase())} placeholder="AP39WK6292" required data-testid="input-new-plate" style={{ textTransform: "uppercase" }} /></div>
            <Button type="submit" disabled={addPlateMut.isPending} data-testid="button-submit-plate">{addPlateMut.isPending ? "Adding..." : "Add Plate"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailBooking !== null} onOpenChange={(v) => { if (!v) setDetailBooking(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold" data-testid="text-detail-client-name">{detailBooking?.clientName}</DialogTitle>
          </DialogHeader>
          {detailBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium" data-testid="text-detail-phone">{detailBooking.clientPhone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Reference</div>
                  <div className="font-medium" data-testid="text-detail-reference">{detailBooking.referenceName && detailBooking.referencePhone ? `${detailBooking.referenceName} (${detailBooking.referencePhone})` : detailBooking.referenceName || detailBooking.referencePhone || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Travel Date</div>
                  <div className="font-medium" data-testid="text-detail-date">{detailBooking.travelDate}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pickup Location</div>
                  <div className="font-medium" data-testid="text-detail-pickup">{detailBooking.pickupLocation}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Drop Location</div>
                  <div className="font-medium" data-testid="text-detail-drop">{detailBooking.dropLocation}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Vehicle (Car Number)</div>
                  <div className="font-medium" data-testid="text-detail-vehicle">{detailBooking.vehicle?.carNumber || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="font-medium" data-testid="text-detail-total">{formatINR(Number(detailBooking.totalAmount))}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Advance Amount</div>
                  <div className="font-medium" data-testid="text-detail-advance">{formatINR(Number(detailBooking.advanceAmount))}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pending Amount</div>
                  <div className={`font-medium ${Number(detailBooking.totalAmount) - Number(detailBooking.advanceAmount) > 0 ? "text-orange-600 dark:text-orange-400" : ""}`} data-testid="text-detail-pending">{formatINR(Math.max(0, Number(detailBooking.totalAmount) - Number(detailBooking.advanceAmount)))}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payment Mode</div>
                  <div className="font-medium" data-testid="text-detail-payment">{detailBooking.paymentMode || "-"}</div>
                </div>
                {detailBooking.vendor && (
                  <div>
                    <div className="text-sm text-muted-foreground">Vendor</div>
                    <div className="font-medium" data-testid="text-detail-vendor">{detailBooking.vendor.name}</div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setDetailBooking(null)} data-testid="button-detail-cancel">Cancel</Button>
                <Button onClick={() => { openEdit(detailBooking); setDetailBooking(null); }} data-testid="button-detail-edit">Edit</Button>
              </div>
            </div>
          )}
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
                  <TableHead>Reference</TableHead>
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
                  <TableRow key={b.id} data-testid={`row-cab-${b.id}`} className="cursor-pointer hover-elevate" onClick={() => setDetailBooking(b)}>
                    <TableCell className="font-medium">{b.clientName}</TableCell>
                    <TableCell data-testid={`text-cab-phone-${b.id}`}>{b.clientPhone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.referenceName || "-"}</TableCell>
                    <TableCell>{b.travelDate}</TableCell>
                    <TableCell>{b.pickupLocation}</TableCell>
                    <TableCell>{b.dropLocation}</TableCell>
                    <TableCell>{b.vehicle?.carNumber || "-"}</TableCell>
                    <TableCell>{formatINR(Number(b.totalAmount))}</TableCell>
                    <TableCell>{formatINR(Number(b.advanceAmount))}</TableCell>
                    <TableCell className="font-medium">{formatINR(Number(b.totalAmount) - Number(b.advanceAmount))}</TableCell>
                  </TableRow>
                ))}
                {(query.data || []).length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No cab bookings yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
