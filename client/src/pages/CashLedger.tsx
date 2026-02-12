import Layout from "@/components/Layout";
import { useState } from "react";
import { useCashTransactions, useCashStats, useCreateCashTransaction } from "@/hooks/use-cash";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCashTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Schema for form (amounts come as string from inputs)
const formSchema = insertCashTransactionSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CashLedger() {
  const { data: transactions, isLoading } = useCashTransactions();
  const { data: stats } = useCashStats();
  const { mutate: createTransaction, isPending } = useCreateCashTransaction();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "in",
      personName: "",
      reason: "",
      amount: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createTransaction(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
        toast({ title: "Transaction recorded", description: "The ledger has been updated." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Cash Ledger</h1>
          <p className="text-muted-foreground">Track all daily cash flow movements.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Cash Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select 
                    onValueChange={(val) => form.setValue("type", val as "in" | "out")} 
                    defaultValue="in"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Cash In (+)</SelectItem>
                      <SelectItem value="out">Cash Out (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" step="0.01" {...form.register("amount")} placeholder="0.00" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Person Name</Label>
                <Input {...form.register("personName")} placeholder="John Doe" />
              </div>

              <div className="space-y-2">
                <Label>Reason / Description</Label>
                <Input {...form.register("reason")} placeholder="Advance payment..." />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Record Transaction
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <p className="text-sm font-medium text-primary/80">Total Balance</p>
          <h2 className="text-4xl font-bold text-primary mt-2 tracking-tight">
            ₹{(stats?.totalBalance || 0).toLocaleString('en-IN')}
          </h2>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <ArrowUpRight className="w-4 h-4" />
            <p className="text-sm font-medium">Total In</p>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            ₹{(stats?.totalIn || 0).toLocaleString('en-IN')}
          </h2>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <ArrowDownLeft className="w-4 h-4" />
            <p className="text-sm font-medium">Total Out</p>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            ₹{(stats?.totalOut || 0).toLocaleString('en-IN')}
          </h2>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Person</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading ledger...</TableCell>
              </TableRow>
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No transactions found</TableCell>
              </TableRow>
            ) : (
              transactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(tx.createdAt || new Date()), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tx.type === 'in' ? 'IN' : 'OUT'}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{tx.personName}</TableCell>
                  <TableCell className="text-muted-foreground">{tx.reason}</TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'in' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
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
