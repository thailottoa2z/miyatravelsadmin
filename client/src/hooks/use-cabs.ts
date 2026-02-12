import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertCabBooking, type InsertVehicle, type InsertCabRun, buildUrl } from "@shared/routes";

// --- Vehicles ---
export function useVehicles() {
  return useQuery({
    queryKey: [api.vehicles.list.path],
    queryFn: async () => {
      const res = await fetch(api.vehicles.list.path);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return api.vehicles.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const res = await fetch(api.vehicles.create.path, {
        method: api.vehicles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create vehicle");
      return api.vehicles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] }),
  });
}

// --- Bookings ---
export function useCabBookings() {
  return useQuery({
    queryKey: [api.cabBookings.list.path],
    queryFn: async () => {
      const res = await fetch(api.cabBookings.list.path);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return api.cabBookings.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCabBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCabBooking) => {
      const payload = { 
        ...data, 
        totalAmount: Number(data.totalAmount),
        advanceAmount: Number(data.advanceAmount)
      };
      const res = await fetch(api.cabBookings.create.path, {
        method: api.cabBookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return api.cabBookings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cabBookings.list.path] }),
  });
}

// --- Runs ---
export function useCabRuns() {
  return useQuery({
    queryKey: [api.cabRuns.list.path],
    queryFn: async () => {
      const res = await fetch(api.cabRuns.list.path);
      if (!res.ok) throw new Error("Failed to fetch runs");
      return api.cabRuns.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCabRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCabRun) => {
      // Coerce all number fields
      const payload = {
        ...data,
        returnAdvance: data.returnAdvance ? Number(data.returnAdvance) : 0,
        driverCollection: data.driverCollection ? Number(data.driverCollection) : 0,
        expenseDiesel: data.expenseDiesel ? Number(data.expenseDiesel) : 0,
        expenseToll: data.expenseToll ? Number(data.expenseToll) : 0,
        expenseParking: data.expenseParking ? Number(data.expenseParking) : 0,
        expenseOthers: data.expenseOthers ? Number(data.expenseOthers) : 0,
        driverSalary: data.driverSalary ? Number(data.driverSalary) : 0,
      };

      const res = await fetch(api.cabRuns.create.path, {
        method: api.cabRuns.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create run log");
      return api.cabRuns.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cabRuns.list.path] }),
  });
}
