import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertFlightBooking, buildUrl } from "@shared/routes";

export function useFlightBookings() {
  return useQuery({
    queryKey: [api.flights.list.path],
    queryFn: async () => {
      const res = await fetch(api.flights.list.path);
      if (!res.ok) throw new Error("Failed to fetch flight bookings");
      return api.flights.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFlightBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFlightBooking) => {
      const payload = { ...data, totalAmount: Number(data.totalAmount) };
      const res = await fetch(api.flights.create.path, {
        method: api.flights.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return api.flights.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.flights.list.path] }),
  });
}

export function useDeleteFlightBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.flights.delete.path, { id });
      const res = await fetch(url, { method: api.flights.delete.method });
      if (!res.ok) throw new Error("Failed to delete booking");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.flights.list.path] }),
  });
}
