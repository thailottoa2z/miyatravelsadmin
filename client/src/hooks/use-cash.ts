import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertCashTransaction } from "@shared/routes";

export function useCashTransactions() {
  return useQuery({
    queryKey: [api.cash.list.path],
    queryFn: async () => {
      const res = await fetch(api.cash.list.path);
      if (!res.ok) throw new Error("Failed to fetch cash transactions");
      return api.cash.list.responses[200].parse(await res.json());
    },
  });
}

export function useCashStats() {
  return useQuery({
    queryKey: [api.cash.stats.path],
    queryFn: async () => {
      const res = await fetch(api.cash.stats.path);
      if (!res.ok) throw new Error("Failed to fetch cash stats");
      return api.cash.stats.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCashTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCashTransaction) => {
      // Ensure amount is string for decimal handling if schema expects it, or number if coerced
      const payload = { ...data, amount: Number(data.amount) }; 
      const res = await fetch(api.cash.create.path, {
        method: api.cash.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create transaction");
      }
      return api.cash.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cash.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cash.stats.path] });
    },
  });
}
