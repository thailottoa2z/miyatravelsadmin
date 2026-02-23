import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, Edit2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

interface ServiceCall {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  callDate: string;
  enquiredServiceType?: string;
  status: "pending" | "remainder" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceCallStats {
  total: number;
  pending: number;
  remainder: number;
  completed: number;
  cancelled: number;
}

export default function ServiceCallsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phoneNumber: "",
    callDate: "",
    enquiredServiceType: "",
    status: "pending",
    notes: "",
  });

  // Fetch service calls
  const { data: serviceCalls = [], isLoading } = useQuery({
    queryKey: ["servicecalls", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const response = await fetch(
        `/api/servicecalls?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch stats
  const { data: stats } = useQuery<ServiceCallStats>({
    queryKey: ["servicecalls-stats"],
    queryFn: async () => {
      const response = await fetch("/api/servicecalls/stats/all");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      console.log("Stats API Response:", data);
      return data;
    },
    enabled: isAuthenticated,
  });

  // Create/Update mutation
  const { mutate: saveServiceCall, isPending: isSaving } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingId ? `/api/servicecalls/${editingId}` : "/api/servicecalls";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save");
      }
      return response.json();
    },
    onSuccess: () => {
      resetForm();
      setIsDialogOpen(false);
      
      // Invalidate queries - React Query will automatically refetch
      queryClient.invalidateQueries({ queryKey: ["servicecalls"] });
      queryClient.invalidateQueries({ queryKey: ["servicecalls-stats"] });
    },
    onError: (error: Error) => {
      console.error("Save failed:", error.message);
    },
  });

  // Delete mutation
  const { mutate: deleteServiceCall, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/servicecalls/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries - React Query will automatically refetch
      queryClient.invalidateQueries({ queryKey: ["servicecalls"] });
      queryClient.invalidateQueries({ queryKey: ["servicecalls-stats"] });
    },
    onError: (error: Error) => {
      console.error("Delete failed:", error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phoneNumber: "",
      callDate: "",
      enquiredServiceType: "",
      status: "pending",
      notes: "",
    });
    setEditingId(null);
  };

  const handleEdit = (call: ServiceCall) => {
    setFormData({
      name: call.name,
      address: call.address,
      phoneNumber: call.phoneNumber,
      callDate: call.callDate.split("T")[0],
      enquiredServiceType: call.enquiredServiceType || "",
      status: call.status,
      notes: call.notes || "",
    });
    setEditingId(String(call.id));
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.address || !formData.phoneNumber) {
      alert("Please fill in all required fields: Name, Address, Phone Number");
      return;
    }
    
    if (!formData.callDate) {
      alert("Please select a service date");
      return;
    }
    
    saveServiceCall(formData);
  };

  const handleDelete = (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this service call? This action cannot be undone.")) {
      deleteServiceCall(String(id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "remainder":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "pending":
      case "remainder":
      case "cancelled":
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Service Calls</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage service calls and follow-ups
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => resetForm()}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Service Call
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-2xl mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">
                {editingId ? "Edit Service Call" : "Add New Service Call"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Fill in the details for the service call
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Client name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="Contact number"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="Service address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Service Date</label>
                  <Input
                    type="date"
                    value={formData.callDate}
                    onChange={(e) =>
                      setFormData({ ...formData, callDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Enquired Service Type</label>
                  <Select value={formData.enquiredServiceType} onValueChange={(value) =>
                    setFormData({ ...formData, enquiredServiceType: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flight Ticket">Flight Ticket</SelectItem>
                      <SelectItem value="Cab">Cab</SelectItem>
                      <SelectItem value="Passport / Visa">Passport / Visa</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="remainder">Remainder</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add any notes or details"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="min-h-[100px]"
                />
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingId ? "Update Service Call" : "Add Service Call"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 sm:pb-4">
              <div className="text-lg sm:text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.pending ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Remainder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.remainder ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.completed ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.cancelled ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <span className="text-sm font-medium">Filter by status:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="remainder">Remainder</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service Calls Table */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-2xl">Service Calls List</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {serviceCalls.length} total service calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : serviceCalls.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No service calls found</AlertDescription>
            </Alert>
          ) : (
            <div className="w-full overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
              <div className="min-w-full inline-block">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs sm:text-sm font-semibold">Name</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden md:table-cell">Address</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden lg:table-cell">Type</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden lg:table-cell">Notes</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceCalls.map((call: ServiceCall) => (
                    <TableRow key={call.id} className="hover:bg-muted/50 transition-colors text-xs sm:text-sm">
                      <TableCell className="font-medium truncate">{call.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{call.phoneNumber}</TableCell>
                      <TableCell className="max-w-xs truncate hidden md:table-cell text-xs">
                        {call.address}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(call.callDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">{call.enquiredServiceType || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={`inline-flex items-center gap-1 text-xs ${getStatusColor(
                            call.status
                          )}`}
                        >
                          {getStatusIcon(call.status)}
                          <span className="hidden sm:inline">{call.status.charAt(0).toUpperCase() + call.status.slice(1)}</span>
                          <span className="sm:hidden">{call.status.charAt(0).toUpperCase()}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground hidden lg:table-cell">
                        {call.notes}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(call)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(call.id)}
                            disabled={isDeleting}
                            className="h-8 w-8 p-0"
                            title="Delete"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
