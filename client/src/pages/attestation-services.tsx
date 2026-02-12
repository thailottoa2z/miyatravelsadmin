
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
import { Plus, Trash2 } from "lucide-react";
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

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/attestation-services/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/attestation-services"] }); },
  });

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const serviceCharge = Number(form.serviceCharge || 0);
  const ourCost = Number(form.ourCost || 0);
  const advanceReceived = Number(form.advanceReceived || 0);
  const pendingAmount = serviceCharge - advanceReceived;
  const margin = serviceCharge - ourCost;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Attestation Services</h1>
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
                        <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(s.id)} data-testid={`button-delete-attest-${s.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
