import Layout from "@/components/Layout";
import { useState } from "react";
import { useVehicles, useCreateVehicle, useCabBookings, useCreateCabBooking } from "@/hooks/use-cabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Car, Loader2, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCabBookingSchema, insertVehicleSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Vehicle Form
const vehicleSchema = insertVehicleSchema;
type VehicleForm = z.infer<typeof vehicleSchema>;

// Booking Form
const bookingSchema = insertCabBookingSchema.extend({
  totalAmount: z.string().min(1, "Required"),
  advanceAmount: z.string().default("0"),
  vehicleId: z.string().or(z.number()), // Handles Select value (string) conversion
  travelDate: z.date().or(z.string()),
});
type BookingForm = z.infer<typeof bookingSchema>;

export default function Cabs() {
  const { data: bookings, isLoading: bookingsLoading } = useCabBookings();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { mutate: createVehicle } = useCreateVehicle();
  const { mutate: createBooking, isPending: bookingPending } = useCreateCabBooking();
  const { toast } = useToast();
  
  const [bookingOpen, setBookingOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  // Forms
  const bookingForm = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      pickupLocation: "",
      dropLocation: "",
      totalAmount: "",
      advanceAmount: "",
    }
  });

  const vehicleForm = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { carNumber: "" }
  });

  // Handlers
  const onVehicleSubmit = (data: VehicleForm) => {
    createVehicle({ ...data, carNumber: data.carNumber.toUpperCase() }, {
      onSuccess: () => {
        setVehicleOpen(false);
        vehicleForm.reset();
        toast({ title: "Vehicle added", description: "New car registered successfully." });
      },
      onError: () => toast({ title: "Error", description: "Could not add vehicle (might be duplicate)", variant: "destructive" })
    });
  };

  const onBookingSubmit = (data: BookingForm) => {
    createBooking({
      ...data,
      vehicleId: Number(data.vehicleId),
      travelDate: format(new Date(data.travelDate), "yyyy-MM-dd"),
    }, {
      onSuccess: () => {
        setBookingOpen(false);
        bookingForm.reset();
        toast({ title: "Booking Confirmed", description: "Cab booking has been saved." });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Cab Operations</h1>
          <p className="text-muted-foreground">Manage fleet, bookings, and driver logs.</p>
        </div>
        <div className="flex gap-3">
          {/* Add Vehicle Dialog */}
          <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Car className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader><DialogTitle>Register New Car</DialogTitle></DialogHeader>
              <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Car Number Plate</Label>
                  <Input 
                    {...vehicleForm.register("carNumber")} 
                    placeholder="KL 07 AA 1234" 
                    className="uppercase"
                  />
                </div>
                <Button type="submit" className="w-full">Save Vehicle</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Booking Dialog */}
          <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" />
                New Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>New Cab Booking</DialogTitle></DialogHeader>
              <form onSubmit={bookingForm.handleSubmit(onBookingSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input {...bookingForm.register("clientName")} placeholder="Full Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input {...bookingForm.register("clientPhone")} placeholder="+91..." />
                  </div>
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label className="mb-1">Travel Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal", !bookingForm.watch("travelDate") && "text-muted-foreground")}>
                        {bookingForm.watch("travelDate") ? format(new Date(bookingForm.watch("travelDate")), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(bookingForm.watch("travelDate"))}
                        onSelect={(date) => date && bookingForm.setValue("travelDate", date)}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pickup</Label>
                    <Input {...bookingForm.register("pickupLocation")} placeholder="Airport / Home" />
                  </div>
                  <div className="space-y-2">
                    <Label>Drop</Label>
                    <Input {...bookingForm.register("dropLocation")} placeholder="Destination" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assign Vehicle</Label>
                  <Select onValueChange={(val) => bookingForm.setValue("vehicleId", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map(v => (
                        <SelectItem key={v.id} value={v.id.toString()}>{v.carNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Amount (₹)</Label>
                    <Input type="number" {...bookingForm.register("totalAmount")} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Advance (₹)</Label>
                    <Input type="number" {...bookingForm.register("advanceAmount")} placeholder="0.00" />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-4" disabled={bookingPending}>
                  {bookingPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm Booking
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Pending</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingsLoading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : bookings?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No bookings yet</TableCell></TableRow>
            ) : (
              bookings?.map((booking) => {
                const pending = Number(booking.totalAmount) - Number(booking.advanceAmount);
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">{format(new Date(booking.travelDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.clientName}</div>
                      <div className="text-xs text-muted-foreground">{booking.clientPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {booking.pickupLocation} → {booking.dropLocation}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs font-mono font-medium">
                        {booking.vehicle?.carNumber || "Unassigned"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{Number(booking.totalAmount).toLocaleString()}</TableCell>
                    <TableCell className={cn("text-right font-bold", pending > 0 ? "text-amber-600" : "text-emerald-600")}>
                      ₹{pending.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
