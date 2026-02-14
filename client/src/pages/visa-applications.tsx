
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
import { Plus, Lock, RefreshCw, Check, Clock, FileCheck, Pencil } from "lucide-react";
import type { VisaApplication } from "@shared/schema";

function StatusBadge({ status, locked }: { status: string; locked?: boolean }) {
  if (locked || status === "locked") return <Badge variant="secondary"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>;
  if (status === "pending") return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  if (status === "completed" || status === "fit") return <Badge variant="default"><Check className="w-3 h-3 mr-1" /> {status === "fit" ? "Fit" : "Completed"}</Badge>;
  if (status === "unfit") return <Badge variant="destructive">Unfit</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function VisaApplications() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [detailVisa, setDetailVisa] = useState<VisaApplication | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editVisaId, setEditVisaId] = useState<number | null>(null);
  const [form, setForm] = useState({ clientName: "", passportNumber: "", phone: "", visaType: "" });

  const query = useQuery<VisaApplication[]>({ queryKey: ["/api/visa-applications"] });

  const createMut = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/visa-applications", form); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visa-applications"] });
      setOpen(false);
      setForm({ clientName: "", passportNumber: "", phone: "", visaType: "" });
      toast({ title: "Visa application created" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: async () => { await apiRequest("PUT", `/api/visa-applications/${editVisaId}`, form); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visa-applications"] });
      setEditOpen(false);
      setEditVisaId(null);
      setForm({ clientName: "", passportNumber: "", phone: "", visaType: "" });
      toast({ title: "Visa application updated" });
    },
    onError: () => toast({ title: "Error updating visa application", variant: "destructive" }),
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) => {
      await apiRequest("PATCH", `/api/visa-applications/${id}/status`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visa-applications"] });
      toast({ title: "Status updated" });
      // Update detail visa from refreshed query data if it's open
      if (detailVisa && query.data) {
        const updated = query.data.find(v => v.id === detailVisa.id);
        if (updated) setDetailVisa(updated);
      }
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleMedical = (id: number, status: "fit" | "unfit" | "pending") => {
    const body: any = { medicalStatus: status };
    if (status === "fit") body.pccStatus = "pending";
    if (status === "pending") { body.pccStatus = "locked"; body.stampingStatus = "locked"; }
    statusMut.mutate({ id, body });
  };

  const handlePcc = (id: number, status: "completed" | "pending") => {
    const body: any = { pccStatus: status };
    if (status === "completed") body.stampingStatus = "pending";
    if (status === "pending") body.stampingStatus = "locked";
    statusMut.mutate({ id, body });
  };

  const handleStamping = (id: number, status: "completed" | "pending") => {
    statusMut.mutate({ id, body: { stampingStatus: status } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-emerald-500/10 dark:bg-emerald-400/10">
            <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Work Visa</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-visa"><Plus className="w-4 h-4 mr-1" /> New Application</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Visa Application</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-3">
              <div><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} required data-testid="input-visa-client" /></div>
              <div><Label>Passport Number</Label><Input value={form.passportNumber} onChange={(e) => setField("passportNumber", e.target.value)} required data-testid="input-visa-passport" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} required data-testid="input-visa-phone" /></div>
              <div>
                <Label>Visa Type</Label>
                <Select value={form.visaType} onValueChange={(v) => setField("visaType", v)}>
                  <SelectTrigger data-testid="select-visa-type"><SelectValue placeholder="Select visa type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employment">Employment</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Tourist">Tourist</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createMut.isPending} data-testid="button-submit-visa">{createMut.isPending ? "Saving..." : "Create Application"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {query.isLoading ? <Skeleton className="h-64" /> : (
        <div className="space-y-3">
          {(query.data || []).map((v) => (
            <Card key={v.id} data-testid={`card-visa-${v.id}`} className="cursor-pointer hover-elevate" onClick={() => setDetailVisa(v)}>
              <CardContent className="p-4">
                <div className="mb-3">
                  <div className="font-semibold">{v.clientName}</div>
                  <div className="text-sm text-muted-foreground">Passport: {v.passportNumber}</div>
                  <div className="text-sm text-muted-foreground">Type: {v.visaType}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Medical:</span>
                    <StatusBadge status={v.medicalStatus} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">PCC:</span>
                    <StatusBadge status={v.pccStatus} locked={v.medicalStatus !== "fit"} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Stamping:</span>
                    <StatusBadge status={v.stampingStatus} locked={v.pccStatus !== "completed"} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(query.data || []).length === 0 && (
            <div className="text-center text-muted-foreground py-12">No visa applications yet</div>
          )}
        </div>
      )}

      {detailVisa && (
        <Dialog open={!!detailVisa} onOpenChange={(isOpen) => !isOpen && setDetailVisa(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <DialogTitle data-testid={`text-detail-title-${detailVisa.id}`}>{detailVisa.clientName}</DialogTitle>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditVisaId(detailVisa.id);
                  setForm({
                    clientName: detailVisa.clientName,
                    passportNumber: detailVisa.passportNumber,
                    phone: detailVisa.phone,
                    visaType: detailVisa.visaType,
                  });
                  setDetailVisa(null);
                  setEditOpen(true);
                }} data-testid={`button-edit-visa-${detailVisa.id}`}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Info Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Phone</div>
                  <div className="font-medium">{detailVisa.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Passport Number</div>
                  <div className="font-medium">{detailVisa.passportNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Visa Type</div>
                  <div className="font-medium">{detailVisa.visaType}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Status Workflow</h3>

                {/* Medical */}
                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium">Medical</div>
                  <StatusBadge status={detailVisa.medicalStatus} />
                  <div className="flex gap-1 flex-wrap">
                    {detailVisa.medicalStatus === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleMedical(detailVisa.id, "fit")} data-testid={`button-medical-fit-${detailVisa.id}`}>Mark Fit</Button>
                        <Button size="sm" variant="outline" onClick={() => handleMedical(detailVisa.id, "unfit")} data-testid={`button-medical-unfit-${detailVisa.id}`}>Mark Unfit</Button>
                      </>
                    )}
                    {detailVisa.medicalStatus === "unfit" && (
                      <Button size="sm" variant="outline" onClick={() => handleMedical(detailVisa.id, "pending")} data-testid={`button-medical-repeat-${detailVisa.id}`}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Repeat Medical
                      </Button>
                    )}
                  </div>
                </div>

                {/* PCC */}
                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium">PCC</div>
                  <StatusBadge status={detailVisa.pccStatus} locked={detailVisa.medicalStatus !== "fit"} />
                  {detailVisa.medicalStatus === "fit" && detailVisa.pccStatus === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => handlePcc(detailVisa.id, "completed")} data-testid={`button-pcc-complete-${detailVisa.id}`}>Mark Completed</Button>
                  )}
                </div>

                {/* Stamping */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Stamping</div>
                  <StatusBadge status={detailVisa.stampingStatus} locked={detailVisa.pccStatus !== "completed"} />
                  {detailVisa.pccStatus === "completed" && detailVisa.stampingStatus === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => handleStamping(detailVisa.id, "completed")} data-testid={`button-stamping-complete-${detailVisa.id}`}>Mark Completed</Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) { setEditOpen(false); setEditVisaId(null); setForm({ clientName: "", passportNumber: "", phone: "", visaType: "" }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Visa Application</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editMut.mutate(); }} className="space-y-3">
            <div><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} required data-testid="input-edit-visa-client" /></div>
            <div><Label>Passport Number</Label><Input value={form.passportNumber} onChange={(e) => setField("passportNumber", e.target.value)} required data-testid="input-edit-visa-passport" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} required data-testid="input-edit-visa-phone" /></div>
            <div>
              <Label>Visa Type</Label>
              <Select value={form.visaType} onValueChange={(v) => setField("visaType", v)}>
                <SelectTrigger data-testid="select-edit-visa-type"><SelectValue placeholder="Select visa type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employment">Employment</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Tourist">Tourist</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={editMut.isPending} data-testid="button-submit-edit-visa">{editMut.isPending ? "Saving..." : "Update Application"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
