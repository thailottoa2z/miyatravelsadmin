
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, HandCoins, Users, Pencil } from "lucide-react";
import type { Vendor } from "@shared/schema";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function Vendors() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [payVendorId, setPayVendorId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editVendorId, setEditVendorId] = useState<number | null>(null);

  const query = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });

  const editMut = useMutation({
    mutationFn: async () => { await apiRequest("PUT", `/api/vendors/${editVendorId}`, { name: vendorName }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setEditOpen(false);
      setEditVendorId(null);
      setVendorName("");
      toast({ title: "Vendor updated" });
    },
    onError: () => toast({ title: "Error updating vendor", variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/vendors", { name: vendorName }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setOpen(false);
      setVendorName("");
      toast({ title: "Vendor added" });
    },
    onError: () => toast({ title: "Duplicate name or error", variant: "destructive" }),
  });

  const payMut = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/vendors/${payVendorId}/payments`, {
        vendorId: payVendorId,
        amount: payAmount,
        paymentDate: payDate,
        notes: payNotes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setPayVendorId(null);
      setPayAmount(""); setPayDate(""); setPayNotes("");
      toast({ title: "Payment recorded" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-rose-500/10 dark:bg-rose-400/10">
            <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Vendors</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-vendor"><Plus className="w-4 h-4 mr-1" /> Add Vendor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-3">
              <div><Label>Vendor Name</Label><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. RiyaB2B" required data-testid="input-vendor-name" /></div>
              <Button type="submit" disabled={createMut.isPending} data-testid="button-submit-vendor">{createMut.isPending ? "Saving..." : "Add Vendor"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) { setEditOpen(false); setEditVendorId(null); setVendorName(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Vendor</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editMut.mutate(); }} className="space-y-3">
            <div><Label>Vendor Name</Label><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. RiyaB2B" required data-testid="input-edit-vendor-name" /></div>
            <Button type="submit" disabled={editMut.isPending} data-testid="button-submit-edit-vendor">{editMut.isPending ? "Saving..." : "Update Vendor"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payVendorId !== null} onOpenChange={(o) => { if (!o) setPayVendorId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment to Vendor</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); payMut.mutate(); }} className="space-y-3">
            <div><Label>Amount</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required data-testid="input-vendor-pay-amount" /></div>
            <div><Label>Payment Date</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required data-testid="input-vendor-pay-date" /></div>
            <div><Label>Notes</Label><Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} data-testid="input-vendor-pay-notes" /></div>
            <Button type="submit" disabled={payMut.isPending} data-testid="button-submit-vendor-pay">{payMut.isPending ? "Processing..." : "Record Payment"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {query.isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Total Owed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data || []).map((v) => (
                  <TableRow key={v.id} data-testid={`row-vendor-${v.id}`}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="font-medium" data-testid={`text-vendor-owed-${v.id}`}>{formatINR(Number(v.totalOwed))}</TableCell>
                    <TableCell>
                      {Number(v.totalOwed) > 0 ? (
                        <Badge variant="destructive">Outstanding</Badge>
                      ) : (
                        <Badge variant="secondary">Clear</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => { setEditVendorId(v.id); setVendorName(v.name); setEditOpen(true); }} data-testid={`button-edit-vendor-${v.id}`}>
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setPayVendorId(v.id); setPayAmount(""); setPayDate(""); setPayNotes(""); }} data-testid={`button-pay-vendor-${v.id}`}>
                          <HandCoins className="w-4 h-4 mr-1" /> Pay
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(query.data || []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No vendors yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
