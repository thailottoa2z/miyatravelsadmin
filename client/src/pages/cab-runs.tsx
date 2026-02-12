
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
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import type { CabRun, CabBooking, CabRunMember } from "@shared/schema";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const emptyMember: CabRunMember = { name: "", phone: "", referenceName: "", referencePhone: "", advancePaid: "0" };

const emptyForm = {
  bookingId: "", clientName: "", advanceAmount: "0", referenceName: "", referencePhone: "",
  startKm: "", closingKm: "",
  isReturnTrip: false, returnDate: "", returnPassengers: "", returnClientName: "", returnAdvance: "0",
  driverCollection: "0", expenseDiesel: "0", expenseToll: "0", expenseParking: "0", expenseOthers: "0", driverSalary: "0",
};

export default function CabRuns() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [members, setMembers] = useState<CabRunMember[]>([]);

  const query = useQuery<CabRun[]>({ queryKey: ["/api/cab-runs"] });
  const bookingsQuery = useQuery<CabBooking[]>({ queryKey: ["/api/cab-bookings"] });

  useEffect(() => {
    if (form.bookingId && !editOpen) {
      const booking = (bookingsQuery.data || []).find((b) => b.id === Number(form.bookingId));
      if (booking) {
        setForm((f) => ({
          ...f,
          clientName: booking.clientName,
          advanceAmount: String(booking.advanceAmount),
        }));
      }
    }
  }, [form.bookingId, bookingsQuery.data, editOpen]);

  const buildBody = () => {
    const body: any = {
      bookingId: form.bookingId ? Number(form.bookingId) : null,
      clientName: form.clientName || null,
      advanceAmount: form.advanceAmount || "0",
      referenceName: form.referenceName || null,
      referencePhone: form.referencePhone || null,
      members: members.filter((m) => m.name.trim()),
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
    return body;
  };

  const createMut = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cab-runs", buildBody());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cab-runs"] });
      setOpen(false);
      resetForm();
      toast({ title: "Cab run created" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      await apiRequest("PUT", `/api/cab-runs/${editId}`, buildBody());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cab-runs"] });
      setEditOpen(false);
      setEditId(null);
      resetForm();
      toast({ title: "Cab run updated" });
    },
    onError: () => toast({ title: "Error updating", variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ ...emptyForm });
    setMembers([]);
  };

  const setField = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const addMember = () => setMembers((m) => [...m, { ...emptyMember }]);
  const removeMember = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, key: keyof CabRunMember, val: string) => {
    setMembers((m) => m.map((mem, idx) => idx === i ? { ...mem, [key]: val } : mem));
  };

  const openEdit = (r: CabRun) => {
    setEditId(r.id);
    setForm({
      bookingId: r.bookingId ? String(r.bookingId) : "",
      clientName: r.clientName || "",
      advanceAmount: String(r.advanceAmount || "0"),
      referenceName: r.referenceName || "",
      referencePhone: r.referencePhone || "",
      startKm: r.startKm ? String(r.startKm) : "",
      closingKm: r.closingKm ? String(r.closingKm) : "",
      isReturnTrip: r.isReturnTrip || false,
      returnDate: r.returnDate || "",
      returnPassengers: r.returnPassengers ? String(r.returnPassengers) : "",
      returnClientName: r.returnClientName || "",
      returnAdvance: String(r.returnAdvance || "0"),
      driverCollection: String(r.driverCollection || "0"),
      expenseDiesel: String(r.expenseDiesel || "0"),
      expenseToll: String(r.expenseToll || "0"),
      expenseParking: String(r.expenseParking || "0"),
      expenseOthers: String(r.expenseOthers || "0"),
      driverSalary: String(r.driverSalary || "0"),
    });
    const existingMembers = Array.isArray(r.members) ? (r.members as CabRunMember[]) : [];
    setMembers(existingMembers.length > 0 ? existingMembers : []);
    setEditOpen(true);
  };

  const membersAdvance = members.reduce((sum, m) => sum + Number(m.advancePaid || 0), 0);
  const onwardAdv = Number(form.advanceAmount || 0);
  const returnAdv = Number(form.returnAdvance || 0);
  const driverCol = Number(form.driverCollection || 0);
  const totalCollection = onwardAdv + returnAdv + driverCol + membersAdvance;
  const totalExpenses = Number(form.expenseDiesel || 0) + Number(form.expenseToll || 0) + Number(form.expenseParking || 0) + Number(form.expenseOthers || 0) + Number(form.driverSalary || 0);
  const totalProfit = totalCollection - totalExpenses;
  const margin = totalCollection - onwardAdv - returnAdv - membersAdvance - totalExpenses;
  const totalKm = (Number(form.closingKm || 0) - Number(form.startKm || 0));

  const formFields = (isEdit: boolean) => (
    <form onSubmit={(e) => { e.preventDefault(); isEdit ? updateMut.mutate() : createMut.mutate(); }} className="space-y-4">
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
        <div><Label>Reference Name</Label><Input value={form.referenceName} onChange={(e) => setField("referenceName", e.target.value)} placeholder="Optional" data-testid="input-run-ref-name" /></div>
        <div><Label>Reference Number</Label><Input value={form.referencePhone} onChange={(e) => setField("referencePhone", e.target.value)} placeholder="Optional" data-testid="input-run-ref-phone" /></div>
      </div>

      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-medium text-sm">Members / Passengers</div>
            <Button type="button" variant="outline" size="sm" onClick={addMember} data-testid="button-add-member">
              <UserPlus className="w-4 h-4 mr-1" /> Add Member
            </Button>
          </div>
          {members.length === 0 && <div className="text-sm text-muted-foreground">No additional members added</div>}
          {members.map((m, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Member {i + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeMember(i)} data-testid={`button-remove-member-${i}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Name</Label><Input value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} placeholder="Name" data-testid={`input-member-name-${i}`} /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={m.phone || ""} onChange={(e) => updateMember(i, "phone", e.target.value)} placeholder="Phone" data-testid={`input-member-phone-${i}`} /></div>
                  <div><Label className="text-xs">Ref. Name</Label><Input value={m.referenceName || ""} onChange={(e) => updateMember(i, "referenceName", e.target.value)} placeholder="Reference Name" data-testid={`input-member-ref-name-${i}`} /></div>
                  <div><Label className="text-xs">Ref. Number</Label><Input value={m.referencePhone || ""} onChange={(e) => updateMember(i, "referencePhone", e.target.value)} placeholder="Reference Phone" data-testid={`input-member-ref-phone-${i}`} /></div>
                </div>
                <div><Label className="text-xs">Advance Paid (INR)</Label><Input type="number" value={m.advancePaid || "0"} onChange={(e) => updateMember(i, "advancePaid", e.target.value)} data-testid={`input-member-advance-${i}`} /></div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

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
          <div className="flex justify-between gap-1 text-sm"><span>Total Collection</span><span className="font-medium">{formatINR(totalCollection)}</span></div>
          <div className="flex justify-between gap-1 text-sm"><span>Total Expenses</span><span className="font-medium">{formatINR(totalExpenses)}</span></div>
          <div className="flex justify-between gap-1 text-sm font-semibold"><span>Total Profit</span><span>{formatINR(totalProfit)}</span></div>
          <div className="flex justify-between gap-1 text-sm"><span>Margin (Driver Handover)</span><span className="font-medium">{formatINR(margin)}</span></div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isEdit ? updateMut.isPending : createMut.isPending} data-testid="button-submit-run">
        {(isEdit ? updateMut.isPending : createMut.isPending) ? "Saving..." : isEdit ? "Update Cab Run" : "Create Cab Run"}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Cab Runs</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button data-testid="button-add-run"><Plus className="w-4 h-4 mr-1" /> New Cab Run</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>New Cab Run</DialogTitle></DialogHeader>
            {formFields(false)}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { setEditId(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>Edit Cab Run</DialogTitle></DialogHeader>
          {formFields(true)}
        </DialogContent>
      </Dialog>

      {query.isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>KM</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data || []).map((r) => {
                  const booking = r.bookingId ? (bookingsQuery.data || []).find((b) => b.id === r.bookingId) : null;
                  const name = r.clientName || booking?.clientName || `#${r.bookingId || "?"}`;
                  const adv = Number(r.advanceAmount || booking?.advanceAmount || 0);
                  const membs = Array.isArray(r.members) ? (r.members as CabRunMember[]) : [];
                  const membAdv = membs.reduce((s, m) => s + Number(m.advancePaid || 0), 0);
                  const col = adv + Number(r.returnAdvance || 0) + Number(r.driverCollection || 0) + membAdv;
                  const exp = Number(r.expenseDiesel || 0) + Number(r.expenseToll || 0) + Number(r.expenseParking || 0) + Number(r.expenseOthers || 0) + Number(r.driverSalary || 0);
                  const km = (r.closingKm && r.startKm) ? r.closingKm - r.startKm : null;
                  return (
                    <TableRow key={r.id} data-testid={`row-run-${r.id}`}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{membs.length > 0 ? membs.map((m) => m.name).join(", ") : "-"}</TableCell>
                      <TableCell>{formatINR(adv + membAdv)}</TableCell>
                      <TableCell>{km !== null ? `${km} km` : "-"}</TableCell>
                      <TableCell>{r.isReturnTrip ? `${r.returnClientName || "Yes"}` : "No"}</TableCell>
                      <TableCell>{formatINR(col)}</TableCell>
                      <TableCell>{formatINR(exp)}</TableCell>
                      <TableCell className="font-medium">{formatINR(col - exp)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : ""}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)} data-testid={`button-edit-run-${r.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(query.data || []).length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No cab runs yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
