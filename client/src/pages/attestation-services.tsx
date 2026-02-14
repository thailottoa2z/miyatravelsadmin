
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
import { useState } from "react";
import { Plus, Trash2, Stamp, Pencil } from "lucide-react";
import type { AttestationService, Vendor } from "@shared/schema";

const DOCUMENT_TYPES = [
  "Degree Certificate",
  "Marriage Certificate",
  "Birth Certificate",
  "Commercial Documents",
  "Power of Attorney",
  "Affidavit",
  "Police Clearance",
  "Medical Certificate",
  "Others",
];

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function AttestationServices() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    clientName: "",
    phone: "",
    referenceName: "",
    referencePhone: "",
    documentType: "",
    targetCountry: "",
    serviceCharge: "",
    ourCost: "0",
    advanceReceived: "0",
    paymentMode: "Cash",
    vendorId: "",
  });
  const [form, setForm] = useState({
    clientName: "",
    phone: "",
    referenceName: "",
    referencePhone: "",
    documentType: "",
    targetCountry: "",
    serviceCharge: "",
    ourCost: "0",
    advanceReceived: "0",
    paymentMode: "Cash",
    vendorId: "",
  });

  const query = useQuery<AttestationService[]>({ queryKey: ["/api/attestation-services"] });
  const vendorsQuery = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });

  const createMut = useMutation({
    mutationFn: async () => {
      const body: any = {
        ...form,
        referenceName: form.referenceName || null,
        referencePhone: form.referencePhone || null,
        serviceCharge: form.serviceCharge,
        ourCost: form.ourCost || "0",
        advanceReceived: form.advanceReceived || "0",
      };
      if (form.paymentMode !== "Credit/Pay Later") {
        body.vendorId = null;
      } else {
        body.vendorId = Number(form.vendorId) || null;
      }
      await apiRequest("POST", "/api/attestation-services", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attestation-services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setOpen(false);
      setForm({ clientName: "", phone: "", referenceName: "", referencePhone: "", documentType: "", targetCountry: "", serviceCharge: "", ourCost: "0", advanceReceived: "0", paymentMode: "Cash", vendorId: "" });
      toast({ title: "Attestation service created" });
    },
    onError: () => toast({ title: "Error creating attestation", variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: async () => {
      const body: any = {
        ...editForm,
        referenceName: editForm.referenceName || null,
        referencePhone: editForm.referencePhone || null,
        serviceCharge: editForm.serviceCharge,
        ourCost: editForm.ourCost || "0",
        advanceReceived: editForm.advanceReceived || "0",
      };
      if (editForm.paymentMode !== "Credit/Pay Later") {
        body.vendorId = null;
      } else {
        body.vendorId = Number(editForm.vendorId) || null;
      }
      await apiRequest("PUT", `/api/attestation-services/${editId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attestation-services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setEditOpen(false);
      setEditId(null);
      toast({ title: "Attestation service updated" });
    },
    onError: () => toast({ title: "Error updating attestation", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/attestation-services/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/attestation-services"] }); },
  });

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const setEditField = (key: string, val: string) => setEditForm((f) => ({ ...f, [key]: val }));

  const openEditDialog = (s: AttestationService) => {
    setEditId(s.id);
    setEditForm({
      clientName: s.clientName,
      phone: s.phone,
      referenceName: s.referenceName || "",
      referencePhone: s.referencePhone || "",
      documentType: s.documentType,
      targetCountry: s.targetCountry,
      serviceCharge: String(s.serviceCharge),
      ourCost: String(s.ourCost),
      advanceReceived: String(s.advanceReceived),
      paymentMode: s.paymentMode || "Cash",
      vendorId: s.vendorId ? String(s.vendorId) : "",
    });
    setEditOpen(true);
  };

  const serviceCharge = Number(form.serviceCharge || 0);
  const ourCost = Number(form.ourCost || 0);
  const advanceReceived = Number(form.advanceReceived || 0);
  const pendingAmount = serviceCharge - advanceReceived;
  const margin = serviceCharge - ourCost;

  const editServiceCharge = Number(editForm.serviceCharge || 0);
  const editOurCost = Number(editForm.ourCost || 0);
  const editAdvanceReceived = Number(editForm.advanceReceived || 0);
  const editPendingAmount = editServiceCharge - editAdvanceReceived;
  const editMargin = editServiceCharge - editOurCost;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-teal-500/10 dark:bg-teal-400/10">
            <Stamp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Attestation Services</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-attestation"><Plus className="w-4 h-4 mr-1" /> New Attestation</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>New Attestation Service</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-3">
              <div><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} required data-testid="input-attest-client" /></div>
              <div><Label>Phone Number</Label><Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} required data-testid="input-attest-phone" /></div>
              <div><Label>Reference Name</Label><Input value={form.referenceName} onChange={(e) => setField("referenceName", e.target.value)} data-testid="input-attest-ref-name" /></div>
              <div><Label>Reference Phone</Label><Input value={form.referencePhone} onChange={(e) => setField("referencePhone", e.target.value)} data-testid="input-attest-ref-phone" /></div>
              <div>
                <Label>Document Type</Label>
                <Select value={form.documentType} onValueChange={(v) => setField("documentType", v)}>
                  <SelectTrigger data-testid="select-attest-doc-type"><SelectValue placeholder="Select document type" /></SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Target Country</Label><Input value={form.targetCountry} onChange={(e) => setField("targetCountry", e.target.value)} placeholder="e.g. UAE, Saudi Arabia" required data-testid="input-attest-country" /></div>

              <Card>
                <CardContent className="p-3 space-y-3">
                  <div className="font-medium text-sm">Financials</div>
                  <div><Label>Service Charge to Client (INR)</Label><Input type="number" value={form.serviceCharge} onChange={(e) => setField("serviceCharge", e.target.value)} required data-testid="input-attest-charge" /></div>
                  <div><Label>Our Cost / Third Party (INR)</Label><Input type="number" value={form.ourCost} onChange={(e) => setField("ourCost", e.target.value)} data-testid="input-attest-cost" /></div>
                  <div><Label>Advance Received (INR)</Label><Input type="number" value={form.advanceReceived} onChange={(e) => setField("advanceReceived", e.target.value)} data-testid="input-attest-advance" /></div>
                  <div className="space-y-1 pt-2 border-t text-sm">
                    <div className="flex justify-between"><span>Pending Amount</span><span className="font-medium" data-testid="text-attest-pending">{formatINR(Math.max(0, pendingAmount))}</span></div>
                    <div className="flex justify-between"><span>Margin (Profit)</span><span className="font-medium" data-testid="text-attest-margin">{formatINR(margin)}</span></div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label>Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={(v) => setField("paymentMode", v)}>
                  <SelectTrigger data-testid="select-attest-payment"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit/Pay Later">Credit/Pay Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.paymentMode === "Cash" && Number(form.advanceReceived) > 0 && (
                <div className="text-xs text-muted-foreground">Advance of {formatINR(Number(form.advanceReceived))} will be added to Agency Cash</div>
              )}
              {form.paymentMode === "Credit/Pay Later" && (
                <div>
                  <Label>Select Vendor</Label>
                  <Select value={form.vendorId} onValueChange={(v) => setField("vendorId", v)}>
                    <SelectTrigger data-testid="select-attest-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      {(vendorsQuery.data || []).map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" disabled={createMut.isPending} data-testid="button-submit-attestation">
                {createMut.isPending ? "Saving..." : "Create Attestation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>Edit Attestation Service</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editMut.mutate(); }} className="space-y-3">
            <div><Label>Client Name</Label><Input value={editForm.clientName} onChange={(e) => setEditField("clientName", e.target.value)} required data-testid="input-edit-attest-client" /></div>
            <div><Label>Phone Number</Label><Input value={editForm.phone} onChange={(e) => setEditField("phone", e.target.value)} required data-testid="input-edit-attest-phone" /></div>
            <div><Label>Reference Name</Label><Input value={editForm.referenceName} onChange={(e) => setEditField("referenceName", e.target.value)} data-testid="input-edit-attest-ref-name" /></div>
            <div><Label>Reference Phone</Label><Input value={editForm.referencePhone} onChange={(e) => setEditField("referencePhone", e.target.value)} data-testid="input-edit-attest-ref-phone" /></div>
            <div>
              <Label>Document Type</Label>
              <Select value={editForm.documentType} onValueChange={(v) => setEditField("documentType", v)}>
                <SelectTrigger data-testid="select-edit-attest-doc-type"><SelectValue placeholder="Select document type" /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Target Country</Label><Input value={editForm.targetCountry} onChange={(e) => setEditField("targetCountry", e.target.value)} placeholder="e.g. UAE, Saudi Arabia" required data-testid="input-edit-attest-country" /></div>

            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="font-medium text-sm">Financials</div>
                <div><Label>Service Charge to Client (INR)</Label><Input type="number" value={editForm.serviceCharge} onChange={(e) => setEditField("serviceCharge", e.target.value)} required data-testid="input-edit-attest-charge" /></div>
                <div><Label>Our Cost / Third Party (INR)</Label><Input type="number" value={editForm.ourCost} onChange={(e) => setEditField("ourCost", e.target.value)} data-testid="input-edit-attest-cost" /></div>
                <div><Label>Advance Received (INR)</Label><Input type="number" value={editForm.advanceReceived} onChange={(e) => setEditField("advanceReceived", e.target.value)} data-testid="input-edit-attest-advance" /></div>
                <div className="space-y-1 pt-2 border-t text-sm">
                  <div className="flex justify-between"><span>Pending Amount</span><span className="font-medium" data-testid="text-edit-attest-pending">{formatINR(Math.max(0, editPendingAmount))}</span></div>
                  <div className="flex justify-between"><span>Margin (Profit)</span><span className="font-medium" data-testid="text-edit-attest-margin">{formatINR(editMargin)}</span></div>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label>Payment Mode</Label>
              <Select value={editForm.paymentMode} onValueChange={(v) => setEditField("paymentMode", v)}>
                <SelectTrigger data-testid="select-edit-attest-payment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit/Pay Later">Credit/Pay Later</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.paymentMode === "Cash" && Number(editForm.advanceReceived) > 0 && (
              <div className="text-xs text-muted-foreground">Advance of {formatINR(Number(editForm.advanceReceived))} will be added to Agency Cash</div>
            )}
            {editForm.paymentMode === "Credit/Pay Later" && (
              <div>
                <Label>Select Vendor</Label>
                <Select value={editForm.vendorId} onValueChange={(v) => setEditField("vendorId", v)}>
                  <SelectTrigger data-testid="select-edit-attest-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {(vendorsQuery.data || []).map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" disabled={editMut.isPending} data-testid="button-submit-edit-attestation">
              {editMut.isPending ? "Saving..." : "Update Attestation"}
            </Button>
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
                  <TableHead>Document</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data || []).map((s) => {
                  const charge = Number(s.serviceCharge);
                  const cost = Number(s.ourCost);
                  const advance = Number(s.advanceReceived);
                  const pending = charge - advance;
                  const mrg = charge - cost;
                  return (
                    <TableRow key={s.id} data-testid={`row-attest-${s.id}`}>
                      <TableCell className="font-medium">{s.clientName}</TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell>{s.documentType}</TableCell>
                      <TableCell>{s.targetCountry}</TableCell>
                      <TableCell>{formatINR(charge)}</TableCell>
                      <TableCell>{formatINR(cost)}</TableCell>
                      <TableCell>{formatINR(advance)}</TableCell>
                      <TableCell>
                        {pending > 0 ? (
                          <Badge variant="destructive">{formatINR(pending)}</Badge>
                        ) : (
                          <Badge variant="secondary">Paid</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{formatINR(mrg)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : ""}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(s)} data-testid={`button-edit-attest-${s.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(s.id)} data-testid={`button-delete-attest-${s.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(query.data || []).length === 0 && (
                  <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">No attestation services yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
