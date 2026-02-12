
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
import { Plus, Lock, RefreshCw, Check, Clock } from "lucide-react";
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

  const statusMut = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) => {
      await apiRequest("PATCH", `/api/visa-applications/${id}/status`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visa-applications"] });
      toast({ title: "Status updated" });
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
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Work Visa</h1>
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
            <Card key={v.id} data-testid={`card-visa-${v.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="font-semibold">{v.clientName}</div>
                    <div className="text-sm text-muted-foreground">Passport: {v.passportNumber} | Phone: {v.phone}</div>
                    <div className="text-sm text-muted-foreground">Type: {v.visaType}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Medical</div>
                    <StatusBadge status={v.medicalStatus} />
                    <div className="flex gap-1 flex-wrap">
                      {v.medicalStatus === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleMedical(v.id, "fit")} data-testid={`button-medical-fit-${v.id}`}>Mark Fit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleMedical(v.id, "unfit")} data-testid={`button-medical-unfit-${v.id}`}>Mark Unfit</Button>
                        </>
                      )}
                      {v.medicalStatus === "unfit" && (
                        <Button size="sm" variant="outline" onClick={() => handleMedical(v.id, "pending")} data-testid={`button-medical-repeat-${v.id}`}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Repeat Medical
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">PCC</div>
                    <StatusBadge status={v.pccStatus} locked={v.medicalStatus !== "fit"} />
                    {v.medicalStatus === "fit" && v.pccStatus === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => handlePcc(v.id, "completed")} data-testid={`button-pcc-complete-${v.id}`}>Mark Completed</Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Stamping</div>
                    <StatusBadge status={v.stampingStatus} locked={v.pccStatus !== "completed"} />
                    {v.pccStatus === "completed" && v.stampingStatus === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => handleStamping(v.id, "completed")} data-testid={`button-stamping-complete-${v.id}`}>Mark Completed</Button>
                    )}
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
    </div>
  );
}
