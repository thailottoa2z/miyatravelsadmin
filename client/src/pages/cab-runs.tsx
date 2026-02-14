
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
import { Plus, Pencil, Trash2, UserPlus, Route as RouteIcon } from "lucide-react";
import type { CabRun, CabBooking, CabRunMember } from "@shared/schema";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const emptyMember: CabRunMember = { name: "", phone: "", referenceName: "", referencePhone: "", advancePaid: "0" };

const emptyForm = {
  bookingId: "", clientName: "", advanceAmount: "0", referenceName: "", referencePhone: "",
  startKm: "", closingKm: "",
  totalPrice: "0", pendingAmount: "0",
  isReturnTrip: false, returnDate: "", returnAdvance: "0",
  driverCollection: "0", expenseDiesel: "0", expenseToll: "0", expenseParking: "0", expenseOthers: "0", driverSalary: "0",
};

export default function CabRuns() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [members, setMembers] = useState<CabRunMember[]>([]);
  const [returnMembers, setReturnMembers] = useState<CabRunMember[]>([]);

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
      totalPrice: form.totalPrice || "0",
      pendingAmount: form.pendingAmount || "0",
      isReturnTrip: form.isReturnTrip,
      returnDate: form.returnDate || null,
      returnMembers: returnMembers.filter((m) => m.name.trim()),
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
    setReturnMembers([]);
  };

  const setField = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const addMember = () => setMembers((m) => [...m, { ...emptyMember }]);
  const removeMember = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, key: keyof CabRunMember, val: string) => {
    setMembers((m) => m.map((mem, idx) => idx === i ? { ...mem, [key]: val } : mem));
  };

  const addReturnMember = () => setReturnMembers((m) => [...m, { ...emptyMember }]);
  const removeReturnMember = (i: number) => setReturnMembers((m) => m.filter((_, idx) => idx !== i));
  const updateReturnMember = (i: number, key: keyof CabRunMember, val: string) => {
    setReturnMembers((m) => m.map((mem, idx) => idx === i ? { ...mem, [key]: val } : mem));
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
      totalPrice: String(r.totalPrice || "0"),
      pendingAmount: String(r.pendingAmount || "0"),
      isReturnTrip: r.isReturnTrip || false,
      returnDate: r.returnDate || "",
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
    const existingReturnMembers = Array.isArray(r.returnMembers) ? (r.returnMembers as CabRunMember[]) : [];
    setReturnMembers(existingReturnMembers.length > 0 ? existingReturnMembers : []);
    setEditOpen(true);
  };

  const membersAdvance = members.reduce((sum, m) => sum + Number(m.advancePaid || 0), 0);
  const returnMembersAdvance = returnMembers.reduce((sum, m) => sum + Number(m.advancePaid || 0), 0);
  const onwardAdv = Number(form.advanceAmount || 0);
  const returnAdv = Number(form.returnAdvance || 0);
  const driverCol = Number(form.driverCollection || 0);
  const totalCollection = onwardAdv + returnAdv + driverCol + membersAdvance + returnMembersAdvance;
  const totalExpenses = Number(form.expenseDiesel || 0) + Number(form.expenseToll || 0) + Number(form.expenseParking || 0) + Number(form.expenseOthers || 0) + Number(form.driverSalary || 0);
  const totalProfit = totalCollection - totalExpenses;
  const margin = totalCollection - onwardAdv - returnAdv - membersAdvance - returnMembersAdvance - totalExpenses;
  const totalKm = (Number(form.closingKm || 0) - Number(form.startKm || 0));
  const computedPending = Number(form.totalPrice || 0) - onwardAdv - membersAdvance - returnAdv - returnMembersAdvance;

  const renderMembersList = (list: CabRunMember[], updateFn: (i: number, key: keyof CabRunMember, val: string) => void, removeFn: (i: number) => void, prefix: string) => (
    <>
      {list.map((m, i) => (
        <Card key={i}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Member {i + 1}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFn(i)} data-testid={`button-remove-${prefix}-${i}`}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Name</Label><Input value={m.name} onChange={(e) => updateFn(i, "name", e.target.value)} placeholder="Name" data-testid={`input-${prefix}-name-${i}`} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={m.phone || ""} onChange={(e) => updateFn(i, "phone", e.target.value)} placeholder="Phone" data-testid={`input-${prefix}-phone-${i}`} /></div>
              <div><Label className="text-xs">Ref. Name</Label><Input value={m.referenceName || ""} onChange={(e) => updateFn(i, "referenceName", e.target.value)} placeholder="Reference Name" data-testid={`input-${prefix}-ref-name-${i}`} /></div>
              <div><Label className="text-xs">Ref. Number</Label><Input value={m.referencePhone || ""} onChange={(e) => updateFn(i, "referencePhone", e.target.value)} placeholder="Reference Phone" data-testid={`input-${prefix}-ref-phone-${i}`} /></div>
            </div>
            <div><Label className="text-xs">Advance Paid (INR)</Label><Input type="number" value={m.advancePaid || "0"} onChange={(e) => updateFn(i, "advancePaid", e.target.value)} data-testid={`input-${prefix}-advance-${i}`} /></div>
          </CardContent>
        </Card>
      ))}
    </>
  );

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
          {renderMembersList(members, updateMember, removeMember, "member")}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Start KM</Label><Input type="number" value={form.startKm} onChange={(e) => setField("startKm", e.target.value)} data-testid="input-run-start-km" /></div>
        <div><Label>Closing KM</Label><Input type="number" value={form.closingKm} onChange={(e) => setField("closingKm", e.target.value)} data-testid="input-run-closing-km" /></div>
      </div>
      {(form.startKm || form.closingKm) && <div className="text-sm text-muted-foreground">Total Distance: {totalKm > 0 ? totalKm : 0} km</div>}

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Total Price (INR)</Label><Input type="number" value={form.totalPrice} onChange={(e) => setField("totalPrice", e.target.value)} data-testid="input-run-total-price" /></div>
        <div>
          <Label>Pending Amount (INR)</Label>
          <div className="text-lg font-semibold mt-1 text-orange-600 dark:text-orange-400" data-testid="text-run-pending">{formatINR(Math.max(0, computedPending))}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={form.isReturnTrip} onCheckedChange={(v) => setField("isReturnTrip", v)} data-testid="switch-return-trip" />
        <Label>Return Trip</Label>
      </div>

      {form.isReturnTrip && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="font-medium text-sm">Return Trip Details</div>
            <div><Label>Return Date</Label><Input type="date" value={form.returnDate} onChange={(e) => setField("returnDate", e.target.value)} data-testid="input-run-return-date" /></div>
            <div><Label>Return Advance</Label><Input type="number" value={form.returnAdvance} onChange={(e) => setField("returnAdvance", e.target.value)} data-testid="input-run-return-advance" /></div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="font-medium text-sm">Return Members</div>
              <Button type="button" variant="outline" size="sm" onClick={addReturnMember} data-testid="button-add-return-member">
                <UserPlus className="w-4 h-4 mr-1" /> Add Member
              </Button>
            </div>
            {returnMembers.length === 0 && <div className="text-sm text-muted-foreground">No return members added</div>}
            {renderMembersList(returnMembers, updateReturnMember, removeReturnMember, "return-member")}
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
          <div className="flex justify-between gap-1 text-sm"><span>Total Price</span><span className="font-medium">{formatINR(Number(form.totalPrice || 0))}</span></div>
          <div className="flex justify-between gap-1 text-sm"><span>Pending Amount</span><span className="font-medium text-orange-600 dark:text-orange-400">{formatINR(Math.max(0, computedPending))}</span></div>
          <div className="border-t my-1" />
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
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-orange-500/10 dark:bg-orange-400/10">
            <RouteIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Cab Runs</h1>
        </div>
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
                  <TableHead>Total Price</TableHead>
                  <TableHead>Pending</TableHead>
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
                  const retMembs = Array.isArray(r.returnMembers) ? (r.returnMembers as CabRunMember[]) : [];
                  const membAdv = membs.reduce((s, m) => s + Number(m.advancePaid || 0), 0);
                  const retMembAdv = retMembs.reduce((s, m) => s + Number(m.advancePaid || 0), 0);
                  const col = adv + Number(r.returnAdvance || 0) + Number(r.driverCollection || 0) + membAdv + retMembAdv;
                  const exp = Number(r.expenseDiesel || 0) + Number(r.expenseToll || 0) + Number(r.expenseParking || 0) + Number(r.expenseOthers || 0) + Number(r.driverSalary || 0);
                  const km = (r.closingKm && r.startKm) ? r.closingKm - r.startKm : null;
                  const tp = Number(r.totalPrice || 0);
                  const pend = tp - adv - membAdv - Number(r.returnAdvance || 0) - retMembAdv;
                  const allMembers = [...membs, ...retMembs];
                  return (
                    <TableRow key={r.id} data-testid={`row-run-${r.id}`}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{allMembers.length > 0 ? allMembers.map((m) => m.name).join(", ") : "-"}</TableCell>
                      <TableCell>{formatINR(tp)}</TableCell>
                      <TableCell className={pend > 0 ? "font-medium text-orange-600 dark:text-orange-400" : ""}>{formatINR(Math.max(0, pend))}</TableCell>
                      <TableCell>{km !== null ? `${km} km` : "-"}</TableCell>
                      <TableCell>{r.isReturnTrip ? (retMembs.length > 0 ? `${retMembs.length} members` : "Yes") : "No"}</TableCell>
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
                {(query.data || []).length === 0 && <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">No cab runs yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
