import Layout from "@/components/Layout";
import { useState } from "react";
import { useVisaApplications, useCreateVisaApplication, useUpdateVisaStatus } from "@/hooks/use-visa";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, CheckCircle2, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVisaApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type VisaForm = z.infer<typeof insertVisaApplicationSchema>;

export default function Visa() {
  const { data: applications, isLoading } = useVisaApplications();
  const { mutate: createVisa, isPending } = useCreateVisaApplication();
  const { mutate: updateStatus } = useUpdateVisaStatus();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<VisaForm>({
    resolver: zodResolver(insertVisaApplicationSchema),
    defaultValues: {
      clientName: "",
      passportNumber: "",
      phone: "",
      visaType: "Visit Visa",
    },
  });

  const onSubmit = (data: VisaForm) => {
    createVisa(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
        toast({ title: "Started", description: "New visa process initiated." });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  const handleStatusUpdate = (id: number, type: 'medical' | 'pcc' | 'stamping', status: string) => {
    const payload: any = { id };
    if (type === 'medical') payload.medicalStatus = status;
    if (type === 'pcc') payload.pccStatus = status;
    if (type === 'stamping') payload.stampingStatus = status;

    updateStatus(payload, {
      onSuccess: () => toast({ title: "Updated", description: "Workflow status updated." }),
      onError: (err) => toast({ title: "Failed", description: err.message, variant: "destructive" })
    });
  };

  const StatusBadge = ({ status, type }: { status: string, type: string }) => {
    if (status === 'locked') return <Badge variant="outline" className="text-muted-foreground border-dashed gap-1"><Lock className="w-3 h-3" /> Locked</Badge>;
    if (status === 'completed' || status === 'fit') return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-none gap-1"><CheckCircle2 className="w-3 h-3" /> {status === 'fit' ? 'Fit' : 'Done'}</Badge>;
    if (status === 'unfit') return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Unfit</Badge>;
    return <Badge variant="secondary" className="text-amber-600 bg-amber-50 hover:bg-amber-100 gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Pending</Badge>;
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Visa Processing</h1>
          <p className="text-muted-foreground">Track medical, PCC, and stamping workflows.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New Visa Application</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input {...form.register("clientName")} placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <Label>Passport Number</Label>
                <Input {...form.register("passportNumber")} placeholder="Z1234567" className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...form.register("phone")} placeholder="+91..." />
              </div>
              <div className="space-y-2">
                <Label>Visa Type</Label>
                <Select onValueChange={(val) => form.setValue("visaType", val)} defaultValue="Visit Visa">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visit Visa">Visit Visa</SelectItem>
                    <SelectItem value="Employment Visa">Employment Visa</SelectItem>
                    <SelectItem value="Student Visa">Student Visa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Start Process
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Passport / Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Medical</TableHead>
              <TableHead>PCC</TableHead>
              <TableHead>Stamping</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : applications?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No applications found</TableCell></TableRow>
            ) : (
              applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-bold font-mono text-primary">{app.passportNumber}</div>
                    <div className="text-sm">{app.clientName}</div>
                  </TableCell>
                  <TableCell>{app.visaType}</TableCell>
                  
                  {/* Medical Status Control */}
                  <TableCell>
                    <Select 
                      value={app.medicalStatus} 
                      onValueChange={(val) => handleStatusUpdate(app.id, 'medical', val)}
                    >
                      <SelectTrigger className="w-[110px] h-8 border-none bg-transparent p-0">
                        <StatusBadge status={app.medicalStatus} type="medical" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="fit">Fit</SelectItem>
                        <SelectItem value="unfit">Unfit</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* PCC Status Control */}
                  <TableCell>
                    <Select 
                      value={app.pccStatus} 
                      onValueChange={(val) => handleStatusUpdate(app.id, 'pcc', val)}
                      disabled={app.medicalStatus !== 'fit'}
                    >
                      <SelectTrigger className="w-[110px] h-8 border-none bg-transparent p-0">
                        <StatusBadge status={app.pccStatus} type="pcc" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Stamping Status Control */}
                  <TableCell>
                    <Select 
                      value={app.stampingStatus} 
                      onValueChange={(val) => handleStatusUpdate(app.id, 'stamping', val)}
                      disabled={app.pccStatus !== 'completed'}
                    >
                      <SelectTrigger className="w-[110px] h-8 border-none bg-transparent p-0">
                        <StatusBadge status={app.stampingStatus} type="stamping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    {app.medicalStatus === 'unfit' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleStatusUpdate(app.id, 'medical', 'pending')}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Restart Medical</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
