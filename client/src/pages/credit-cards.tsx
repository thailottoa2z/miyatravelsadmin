
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, CreditCard as CreditCardIcon, AlertTriangle, Pencil } from "lucide-react";
import type { CreditCard } from "@shared/schema";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function CreditCards() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ cardName: "", bankName: "", totalLimit: "", usedAmount: "0", nextBillDate: "" });
  const [repayId, setRepayId] = useState<number | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [form, setForm] = useState({ cardName: "", bankName: "", totalLimit: "", usedAmount: "0", nextBillDate: "" });

  const query = useQuery<CreditCard[]>({ queryKey: ["/api/credit-cards"] });

  const createMut = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/credit-cards", form); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      setOpen(false);
      setForm({ cardName: "", bankName: "", totalLimit: "", usedAmount: "0", nextBillDate: "" });
      toast({ title: "Credit card added" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const repayMut = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/credit-cards/${repayId}/repay`, { amount: Number(repayAmount) }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      setRepayId(null);
      setRepayAmount("");
      toast({ title: "Repayment recorded" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: async () => { await apiRequest("PUT", `/api/credit-cards/${editId}`, editForm); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      setEditOpen(false);
      setEditId(null);
      toast({ title: "Credit card updated" });
    },
    onError: () => toast({ title: "Error updating card", variant: "destructive" }),
  });

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const setEditField = (key: string, val: string) => setEditForm((f) => ({ ...f, [key]: val }));

  const openEditDialog = (card: CreditCard) => {
    setEditId(card.id);
    setEditForm({
      cardName: card.cardName,
      bankName: card.bankName,
      totalLimit: String(card.totalLimit),
      usedAmount: String(card.usedAmount),
      nextBillDate: card.nextBillDate,
    });
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-violet-500/10 dark:bg-violet-400/10">
            <CreditCardIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Credit Cards</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-card"><Plus className="w-4 h-4 mr-1" /> Add Card</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Credit Card</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-3">
              <div><Label>Card Name</Label><Input value={form.cardName} onChange={(e) => setField("cardName", e.target.value)} required data-testid="input-card-name" /></div>
              <div><Label>Bank Name</Label><Input value={form.bankName} onChange={(e) => setField("bankName", e.target.value)} required data-testid="input-card-bank" /></div>
              <div><Label>Total Limit (INR)</Label><Input type="number" value={form.totalLimit} onChange={(e) => setField("totalLimit", e.target.value)} required data-testid="input-card-limit" /></div>
              <div><Label>Used Amount (INR)</Label><Input type="number" value={form.usedAmount} onChange={(e) => setField("usedAmount", e.target.value)} data-testid="input-card-used" /></div>
              <div><Label>Next Bill Date</Label><Input type="date" value={form.nextBillDate} onChange={(e) => setField("nextBillDate", e.target.value)} required data-testid="input-card-bill-date" /></div>
              <Button type="submit" disabled={createMut.isPending} data-testid="button-submit-card">{createMut.isPending ? "Saving..." : "Add Card"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={repayId !== null} onOpenChange={(o) => { if (!o) setRepayId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Repayment</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); repayMut.mutate(); }} className="space-y-3">
            <div><Label>Amount Paid</Label><Input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} required data-testid="input-repay-amount" /></div>
            <Button type="submit" disabled={repayMut.isPending} data-testid="button-submit-repay">{repayMut.isPending ? "Processing..." : "Record Payment"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Credit Card</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editMut.mutate(); }} className="space-y-3">
            <div><Label>Card Name</Label><Input value={editForm.cardName} onChange={(e) => setEditField("cardName", e.target.value)} required data-testid="input-edit-card-name" /></div>
            <div><Label>Bank Name</Label><Input value={editForm.bankName} onChange={(e) => setEditField("bankName", e.target.value)} required data-testid="input-edit-card-bank" /></div>
            <div><Label>Total Limit (INR)</Label><Input type="number" value={editForm.totalLimit} onChange={(e) => setEditField("totalLimit", e.target.value)} required data-testid="input-edit-card-limit" /></div>
            <div><Label>Used Amount (INR)</Label><Input type="number" value={editForm.usedAmount} onChange={(e) => setEditField("usedAmount", e.target.value)} data-testid="input-edit-card-used" /></div>
            <div><Label>Next Bill Date</Label><Input type="date" value={editForm.nextBillDate} onChange={(e) => setEditField("nextBillDate", e.target.value)} required data-testid="input-edit-card-bill-date" /></div>
            <Button type="submit" disabled={editMut.isPending} data-testid="button-submit-edit-card">{editMut.isPending ? "Saving..." : "Update Card"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {query.isLoading ? <Skeleton className="h-64" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(query.data || []).map((card) => {
            const limit = Number(card.totalLimit);
            const used = Number(card.usedAmount);
            const available = limit - used;
            const usagePercent = limit > 0 ? (used / limit) * 100 : 0;
            const isWarning = usagePercent >= 70 && usagePercent < 90;
            const isDanger = usagePercent >= 90;
            const progressColor = isDanger ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-primary";

            return (
              <Card key={card.id} data-testid={`card-credit-${card.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold" data-testid={`text-card-name-${card.id}`}>{card.cardName}</div>
                      <div className="text-sm text-muted-foreground">{card.bankName}</div>
                    </div>
                    <CreditCardIcon className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span className="font-medium">{formatINR(used)}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Available: {formatINR(available)}</span>
                      <span>Limit: {formatINR(limit)}</span>
                    </div>
                  </div>

                  {isWarning && (
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs">
                      <AlertTriangle className="w-3 h-3" /> Usage at {usagePercent.toFixed(0)}%
                    </div>
                  )}
                  {isDanger && (
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" /> Critical: Usage at {usagePercent.toFixed(0)}%
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                    <span className="text-muted-foreground">Next Bill: {card.nextBillDate}</span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(card)} data-testid={`button-edit-card-${card.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setRepayId(card.id); setRepayAmount(""); }} data-testid={`button-repay-${card.id}`}>
                        Bill Paid
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(query.data || []).length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">No credit cards added yet</div>
          )}
        </div>
      )}
    </div>
  );
}
