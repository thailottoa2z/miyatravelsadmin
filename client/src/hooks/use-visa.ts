import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertVisaApplication, buildUrl } from "@shared/routes";

export function useVisaApplications(search?: string) {
  return useQuery({
    queryKey: [api.visa.list.path, search],
    queryFn: async () => {
      let url = api.visa.list.path;
      if (search) url += `?search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch visa applications");
      return api.visa.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateVisaApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVisaApplication) => {
      const res = await fetch(api.visa.create.path, {
        method: api.visa.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create application");
      return api.visa.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.visa.list.path] }),
  });
}

export function useUpdateVisaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & any) => {
      const url = buildUrl(api.visa.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.visa.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.visa.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.visa.list.path] }),
  });
}
