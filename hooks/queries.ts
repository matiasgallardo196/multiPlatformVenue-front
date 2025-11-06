"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuthUser } from "@/hooks/use-auth";
import type {
  Person,
  Place,
  Incident,
  Banned,
  CreatePersonDto,
  UpdatePersonDto,
  CreatePlaceDto,
  UpdatePlaceDto,
  CreateIncidentDto,
  UpdateIncidentDto,
  CreateBannedDto,
  UpdateBannedDto,
  PersonBanStatus,
  ApproveBannedPlaceDto,
  BannedHistory,
  CheckActiveBansResponse,
} from "@/lib/types";

// Query Keys
export const queryKeys = {
  authMe: ["auth", "me"] as const,
  persons: ["persons"] as const,
  person: (id: string) => ["persons", id] as const,
  places: ["places"] as const,
  place: (id: string) => ["places", id] as const,
  incidents: ["incidents"] as const,
  incident: (id: string) => ["incidents", id] as const,
  banneds: ["banneds"] as const,
  banned: (id: string) => ["banneds", id] as const,
  personBans: (personId: string) => ["banneds", "person", personId] as const,
  personBanStatus: (personId: string) =>
    ["banneds", "person", personId, "active"] as const,
  pendingBanneds: ["banneds", "pending"] as const,
  approvalQueueBanneds: ["banneds", "approval-queue"] as const,
  bannedHistory: (bannedId: string) => ["banneds", bannedId, "history"] as const,
  personSearch: (query: string) => ["persons", "search", query] as const,
};

// Persons Hooks
export function usePersons(filters?: {
  gender?: "all" | "Male" | "Female" | null;
  search?: string;
  sortBy?: "newest-first" | "oldest-first" | "name-asc" | "name-desc";
}) {
  const queryKey = filters
    ? [...queryKeys.persons, "filtered", filters]
    : queryKeys.persons;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.gender && filters.gender !== "all") {
        if (filters.gender === null) {
          params.append("gender", "null");
        } else {
          params.append("gender", filters.gender);
        }
      }
      
      if (filters?.search && filters.search.trim()) {
        params.append("search", filters.search.trim());
      }
      
      if (filters?.sortBy) {
        params.append("sortBy", filters.sortBy);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/persons?${queryString}` : "/persons";
      return api.get<Person[]>(url);
    },
    retry: 3,
    retryDelay: 1000,
  });
}

// Search persons by name/nickname server-side if supported by backend.
// Falls back to returning an empty list when query is empty.
export function useSearchPersons(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.personSearch(query || "__empty__"),
    queryFn: async () => {
      if (!query) return [] as Person[];
      try {
        // Prefer server-side search if available
        const encoded = encodeURIComponent(query);
        return await api.get<Person[]>(`/persons?query=${encoded}`);
      } catch {
        // Graceful fallback: no results
        return [] as Person[];
      }
    },
    enabled: enabled,
    staleTime: 30_000,
  });
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: queryKeys.person(id),
    queryFn: () => api.get<Person>(`/persons/${id}`),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonDto) => api.post<Person>("/persons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonDto }) =>
      api.patch<Person>(`/persons/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons });
      queryClient.invalidateQueries({ queryKey: queryKeys.person(id) });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/persons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons });
    },
  });
}

// Places Hooks
export function usePlaces() {
  return useQuery({
    queryKey: queryKeys.places,
    queryFn: () => api.get<Place[]>("/places"),
    retry: 3,
    retryDelay: 1000,
  });
}

export function usePlace(id: string) {
  return useQuery({
    queryKey: queryKeys.place(id),
    queryFn: () => api.get<Place>(`/places/${id}`),
    enabled: !!id,
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlaceDto) => api.post<Place>("/places", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlaceDto }) =>
      api.patch<Place>(`/places/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places });
      queryClient.invalidateQueries({ queryKey: queryKeys.place(id) });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/places/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places });
    },
  });
}

// Incidents Hooks
export function useIncidents() {
  return useQuery({
    queryKey: queryKeys.incidents,
    queryFn: () => api.get<Incident[]>("/incidents"),
    retry: 3,
    retryDelay: 1000,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: queryKeys.incident(id),
    queryFn: () => api.get<Incident>(`/incidents/${id}`),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncidentDto) =>
      api.post<Incident>("/incidents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidentDto }) =>
      api.patch<Incident>(`/incidents/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents });
      queryClient.invalidateQueries({ queryKey: queryKeys.incident(id) });
    },
  });
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents });
    },
  });
}

// Banneds Hooks
export function useBanneds(sortBy?: string) {
  const queryKey = sortBy
    ? [...queryKeys.banneds, "sorted", sortBy]
    : queryKeys.banneds;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy) {
        params.append("sortBy", sortBy);
      }
      const queryString = params.toString();
      const url = queryString ? `/banneds?${queryString}` : "/banneds";
      return api.get<Banned[]>(url);
    },
    retry: 3,
    retryDelay: 1000,
  });
}

export function useBanned(id: string) {
  return useQuery({
    queryKey: queryKeys.banned(id),
    queryFn: () => api.get<Banned>(`/banneds/${id}`),
    enabled: !!id,
  });
}

export function useIncrementBannedViolation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bannedId: string) => api.post(`/banneds/${bannedId}/violations/increment`, {}),
    onSuccess: (data: Banned) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banneds });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.banned(data.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.bannedHistory(data.id) });
      }
    },
  });
}

export function usePersonBans(personId: string) {
  return useQuery({
    queryKey: queryKeys.personBans(personId),
    queryFn: () => api.get<Banned[]>(`/banneds/person/${personId}`),
    enabled: !!personId,
  });
}

export function usePersonBanStatus(personId: string) {
  return useQuery({
    queryKey: queryKeys.personBanStatus(personId),
    queryFn: () =>
      api.get<PersonBanStatus>(`/banneds/person/${personId}/active`),
    enabled: !!personId,
  });
}

export function useCheckActiveBans() {
  return useMutation({
    mutationFn: (data: { personId: string; placeIds: string[] }) =>
      api.post<CheckActiveBansResponse>("/banneds/check-active", data),
  });
}

export function useCreateBanned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBannedDto) => api.post<Banned>("/banneds", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banneds });
    },
  });
}

export function useUpdateBanned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBannedDto }) =>
      api.patch<Banned>(`/banneds/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banneds });
      queryClient.invalidateQueries({ queryKey: queryKeys.banned(id) });
    },
  });
}

export function useDeleteBanned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/banneds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banneds });
    },
  });
}

export function usePendingBanneds(sortBy?: string) {
  const queryKey = sortBy
    ? [...queryKeys.pendingBanneds, 'sorted', sortBy]
    : queryKeys.pendingBanneds;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);
      const queryString = params.toString();
      const url = queryString ? `/banneds/pending?${queryString}` : "/banneds/pending";
      return api.get<Banned[]>(url);
    },
    retry: 3,
    retryDelay: 1000,
  });
}

export function useApprovalQueueBanneds(sortBy?: string, createdBy?: string | null) {
  const queryKey = sortBy
    ? [...queryKeys.approvalQueueBanneds, 'sorted', sortBy, createdBy || 'all']
    : [...queryKeys.approvalQueueBanneds, createdBy || 'all'];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);
      if (createdBy) params.append('createdBy', createdBy);
      const queryString = params.toString();
      const url = queryString
        ? `/banneds/approval-queue?${queryString}`
        : "/banneds/approval-queue";
      return api.get<Banned[]>(url);
    },
    retry: 3,
    retryDelay: 1000,
  });
}

export function useApproveBannedPlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bannedId,
      data,
    }: {
      bannedId: string;
      data: ApproveBannedPlaceDto;
    }) => api.post<Banned>(`/banneds/${bannedId}/approve`, data),
    onSuccess: (_, { bannedId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banneds });
      queryClient.invalidateQueries({ queryKey: queryKeys.banned(bannedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalQueueBanneds });
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingBanneds });
      queryClient.invalidateQueries({ queryKey: queryKeys.bannedHistory(bannedId) });
    },
  });
}

// Bulk approve banneds pending for head-manager's place with optional filters
export function useBulkApproveBanneds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { createdBy?: string; gender?: 'Male' | 'Female'; bannedIds?: string[]; placeIds?: string[]; maxBatchSize?: number }) => {
      return api.post<{ approvedCount: number; failedCount: number; failures?: Array<{ id: string; reason: string }> }>(
        "/banneds/approve/bulk",
        payload,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalQueueBanneds });
    },
  });
}

export function useBannedHistory(bannedId: string) {
  return useQuery({
    queryKey: queryKeys.bannedHistory(bannedId),
    queryFn: () => api.get<BannedHistory[]>(`/banneds/${bannedId}/history`),
    enabled: !!bannedId,
    retry: 3,
    retryDelay: 1000,
  });
}
// Auth Hooks
export async function fetchAuthMe() {
  const userData = await api.get<any>("/auth/me");
  return {
    userId: userData.userId as string,
    userName: userData.userName as string,
    role: userData.role as string,
    email: userData.email as string,
    placeId: userData.placeId as string | null,
    city: userData.city as string | null,
  } satisfies NonNullable<AuthUser>;
}

export function useAuthMe(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.authMe,
    queryFn: fetchAuthMe,
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
