
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
import { Plus, Trash2, Pencil, AlertTriangle, Plane } from "lucide-react";
import type { FlightBooking, Vendor } from "@shared/schema";

const PLATFORMS = ["MakeMyTrip", "Goibibo", "Cleartrip", "Via.com", "Akbar Travels", "Others"];

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const emptyForm = { clientName: "", clientPhone: "", referenceName: "", referencePhone: "", sector: "", travelDate: "", airline: "", platform: "", platformNotes: "", totalAmount: "", advancePaid: "0", paymentMode: "Cash", vendorId: "" };

export default function FlightBookings() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [detailBooking, setDetailBooking] = useState<FlightBooking | null>(null);

  const query = useQuery<FlightBooking[]>({ queryKey: ["/api/flight-bookings"] });
  const vendorsQuery = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });

  const upcomingFlights = useMemo(() => {
    if (!query.data) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    return query.data.filter((f) => {
      const td = new Date(f.travelDate);
      td.setHours(0, 0, 0, 0);
      return td >= today && td <= twoDaysLater;
    });
  }, [query.data]);

  const createMut = useMutation({
    mutationFn: async () => {
      const body: any = { ...form };
      if (form.platform !== "Others") body.platformNotes = null;
      if (form.paymentMode !== "Credit/Pay Later") { body.vendorId = null; } else { body.vendorId = Number(form.vendorId) || null; }
      if (!body.referenceName) body.referenceName = null;
      if (!body.referencePhone) body.referencePhone = null;
      body.reminderDate = null;
      body.reminderNote = null;
      await apiRequest("POST", "/api/flight-bookings", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flight-bookings"] });
      setOpen(false);
      setForm({ ...emptyForm });
      toast({ title: "Flight booking created" });
    },
    onError: () => toast({ title: "Error creating booking", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      const body: any = { ...form };
      if (form.platform !== "Others") body.platformNotes = null;
      if (form.paymentMode !== "Credit/Pay Later") { body.vendorId = null; } else { body.vendorId = Number(form.vendorId) || null; }
      if (!body.referenceName) body.referenceName = null;
      if (!body.referencePhone) body.referencePhone = null;
      body.reminderDate = null;
      body.reminderNote = null;
      await apiRequest("PUT", `/api/flight-bookings/${editId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flight-bookings"] });
      setEditOpen(false);
      setEditId(null);
      setForm({ ...emptyForm });
      toast({ title: "Flight booking updated" });
    },
    onError: () => toast({ title: "Error updating booking", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/flight-bookings/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/flight-bookings"] }); },
  });

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const openEdit = (f: FlightBooking) => {
    setEditId(f.id);
    setForm({
      clientName: f.clientName,
      clientPhone: f.clientPhone,
      referenceName: f.referenceName || "",
      referencePhone: f.referencePhone || "",
      sector: f.sector,
      travelDate: f.travelDate,
      airline: f.airline,
      platform: f.platform,
      platformNotes: f.platformNotes || "",
      totalAmount: String(f.totalAmount),
      advancePaid: String(f.advancePaid || "0"),
      paymentMode: f.paymentMode || "Cash",
      vendorId: f.vendorId ? String(f.vendorId) : "",
    });
    setEditOpen(true);
  };

  const formFields = (isEdit: boolean) => (
    <form onSubmit={(e) => { e.preventDefault(); isEdit ? updateMut.mutate() : createMut.mutate(); }} className="space-y-3">
      <div><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} required data-testid="input-flight-client" /></div>
      <div><Label>Contact Number</Label><Input value={form.clientPhone} onChange={(e) => setField("clientPhone", e.target.value)} required data-testid="input-flight-phone" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Reference Name</Label><Input value={form.referenceName} onChange={(e) => setField("referenceName", e.target.value)} placeholder="Optional" data-testid="input-flight-ref-name" /></div>
        <div><Label>Reference Number</Label><Input value={form.referencePhone} onChange={(e) => setField("referencePhone", e.target.value)} placeholder="Optional" data-testid="input-flight-ref-phone" /></div>
      </div>
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
      <div><Label>Advance Paid (INR)</Label><Input type="number" value={form.advancePaid} onChange={(e) => setField("advancePaid", e.target.value)} data-testid="input-flight-advance" /></div>
      {Number(form.totalAmount || 0) > 0 && (
        <div className="text-sm text-muted-foreground">Pending: {formatINR(Math.max(0, Number(form.totalAmount || 0) - Number(form.advancePaid || 0)))}</div>
      )}
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
      <Button type="submit" disabled={isEdit ? updateMut.isPending : createMut.isPending} data-testid="button-submit-flight">
        {(isEdit ? updateMut.isPending : createMut.isPending) ? "Saving..." : isEdit ? "Update Booking" : "Create Booking"}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      {upcomingFlights.length > 0 && (
        <div className="space-y-2">
          {upcomingFlights.map((f) => (
            <Card key={`alert-${f.id}`}>
              <CardContent className="flex items-center gap-3 p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">{f.clientName}</span> - Flight on <span className="font-medium">{f.travelDate}</span> ({f.sector}, {f.airline})
                </div>
                <Badge variant="outline" className="ml-auto shrink-0">Upcoming</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-blue-500/10 dark:bg-blue-400/10">
            <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Flight Bookings</h1>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm({ ...emptyForm }); }}>
          <DialogTrigger asChild><Button data-testid="button-add-flight"><Plus className="w-4 h-4 mr-1" /> New Booking</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>New Flight Booking</DialogTitle></DialogHeader>
            {formFields(false)}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { setEditId(null); setForm({ ...emptyForm }); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>Edit Flight Booking</DialogTitle></DialogHeader>
          {formFields(true)}
        </DialogContent>
      </Dialog>

      <Dialog open={detailBooking !== null} onOpenChange={(v) => { if (!v) setDetailBooking(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto" data-testid="dialog-flight-detail">
          <DialogHeader><DialogTitle className="text-2xl font-semibold" data-testid="text-detail-client-name">{detailBooking?.clientName}</DialogTitle></DialogHeader>
          {detailBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium" data-testid="text-detail-phone">{detailBooking.clientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reference</p>
                  <p className="font-medium" data-testid="text-detail-reference">{detailBooking.referenceName && detailBooking.referencePhone ? `${detailBooking.referenceName} (${detailBooking.referencePhone})` : detailBooking.referenceName || detailBooking.referencePhone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sector</p>
                  <p className="font-medium" data-testid="text-detail-sector">{detailBooking.sector}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Travel Date</p>
                  <p className="font-medium" data-testid="text-detail-date">{detailBooking.travelDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Airline</p>
                  <p className="font-medium" data-testid="text-detail-airline">{detailBooking.airline}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Platform</p>
                  <p className="font-medium" data-testid="text-detail-platform">{detailBooking.platform === "Others" ? detailBooking.platformNotes || "Others" : detailBooking.platform}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-medium" data-testid="text-detail-total">{formatINR(Number(detailBooking.totalAmount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Advance Paid</p>
                  <p className="font-medium" data-testid="text-detail-advance">{formatINR(Number(detailBooking.advancePaid || 0))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Amount</p>
                  <p className={`font-medium ${Number(detailBooking.totalAmount) - Number(detailBooking.advancePaid || 0) > 0 ? "text-orange-600 dark:text-orange-400" : ""}`} data-testid="text-detail-pending">{formatINR(Number(detailBooking.totalAmount) - Number(detailBooking.advancePaid || 0))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Mode</p>
                  <p className="font-medium" data-testid="text-detail-payment">{detailBooking.paymentMode || "Cash"}</p>
                </div>
                {detailBooking.vendorId && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vendor</p>
                    <p className="font-medium" data-testid="text-detail-vendor">{vendorsQuery.data?.find(v => v.id === detailBooking.vendorId)?.name || "-"}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailBooking(null)} data-testid="button-close-detail">Cancel</Button>
                <Button onClick={() => { openEdit(detailBooking); setDetailBooking(null); }} data-testid="button-detail-edit"><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                <Button variant="destructive" onClick={() => { deleteMut.mutate(detailBooking.id); setDetailBooking(null); }} data-testid="button-detail-delete"><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
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
                  <TableHead>Sector</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Airline</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data || []).map((f) => {
                  const pending = Number(f.totalAmount) - Number(f.advancePaid || 0);
                  return (
                    <TableRow key={f.id} data-testid={`row-flight-${f.id}`} className="cursor-pointer hover-elevate" onClick={() => setDetailBooking(f)}>
                      <TableCell className="font-medium">{f.clientName}</TableCell>
                      <TableCell data-testid={`text-flight-phone-${f.id}`}>{f.clientPhone}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.referenceName || "-"}</TableCell>
                      <TableCell>{f.sector}</TableCell>
                      <TableCell>{f.travelDate}</TableCell>
                      <TableCell>{f.airline}</TableCell>
                      <TableCell>{f.platform === "Others" ? f.platformNotes || "Others" : f.platform}</TableCell>
                      <TableCell className="font-medium">{formatINR(Number(f.totalAmount))}</TableCell>
                      <TableCell>{formatINR(Number(f.advancePaid || 0))}</TableCell>
                      <TableCell className={pending > 0 ? "font-medium text-orange-600 dark:text-orange-400" : ""}>{formatINR(pending)}</TableCell>
                    </TableRow>
                  );
                })}
                {(query.data || []).length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No flight bookings yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
