import Layout from "@/components/Layout";
import { useState } from "react";
import { useFlightBookings, useCreateFlightBooking, useDeleteFlightBooking } from "@/hooks/use-flights";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFlightBookingSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = insertFlightBookingSchema.extend({
  totalAmount: z.string().min(1, "Amount is required"),
  // Date comes from Calendar as Date object, needs formatting for API or handled by form
  travelDate: z.date({ required_error: "Travel date is required" }).or(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export default function Flights() {
  const { data: bookings, isLoading } = useFlightBookings();
  const { mutate: createBooking, isPending } = useCreateFlightBooking();
  const { mutate: deleteBooking } = useDeleteFlightBooking();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      sector: "",
      airline: "",
      platform: "",
      platformNotes: "",
      totalAmount: "",
    },
  });

  const selectedPlatform = form.watch("platform");

  const onSubmit = (data: FormValues) => {
    // Format date to string YYYY-MM-DD
    const payload = {
      ...data,
      travelDate: format(new Date(data.travelDate), "yyyy-MM-dd"),
    };

    createBooking(payload, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
        toast({ title: "Booking created", description: "Flight booking has been saved." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      deleteBooking(id, {
        onSuccess: () => toast({ title: "Deleted", description: "Booking removed successfully." }),
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Flight Bookings</h1>
          <p className="text-muted-foreground">Manage domestic and international flight tickets.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Flight Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input {...form.register("clientName")} placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input {...form.register("clientPhone")} placeholder="+91..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Input {...form.register("sector")} placeholder="DEL - BOM" />
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label className="mb-2">Travel Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !form.watch("travelDate") && "text-muted-foreground"
                        )}
                      >
                        {form.watch("travelDate") ? (
                          format(new Date(form.watch("travelDate")), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(form.watch("travelDate"))}
                        onSelect={(date) => date && form.setValue("travelDate", date)}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Airline</Label>
                  <Input {...form.register("airline")} placeholder="IndiGo, AirIndia..." />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount (₹)</Label>
                  <Input type="number" {...form.register("totalAmount")} placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Booking Platform</Label>
                <Select onValueChange={(val) => form.setValue("platform", val)} defaultValue={form.watch("platform")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Akbar Travels">Akbar Travels</SelectItem>
                    <SelectItem value="Riya Travels">Riya Travels</SelectItem>
                    <SelectItem value="EaseMyTrip">EaseMyTrip</SelectItem>
                    <SelectItem value="MakeMyTrip">MakeMyTrip</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPlatform === "Others" && (
                <div className="space-y-2">
                  <Label>Platform Notes</Label>
                  <Input {...form.register("platformNotes")} placeholder="Specify platform name..." />
                </div>
              )}

              <Button type="submit" className="w-full mt-4" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Booking
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Travel Date</TableHead>
              <TableHead>Client Details</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Airline</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">Loading bookings...</TableCell>
              </TableRow>
            ) : bookings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No flight bookings found</TableCell>
              </TableRow>
            ) : (
              bookings?.map((booking) => (
                <TableRow key={booking.id} className="group">
                  <TableCell className="font-mono text-sm">
                    {format(new Date(booking.travelDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.clientName}</div>
                    <div className="text-xs text-muted-foreground">{booking.clientPhone}</div>
                  </TableCell>
                  <TableCell>{booking.sector}</TableCell>
                  <TableCell>{booking.airline}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {booking.platform === 'Others' ? booking.platformNotes : booking.platform}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(booking.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
