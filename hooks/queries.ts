"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import type { AuthUser } from "@/hooks/use-auth";
import type {
  Person,
  Place,
  Banned,
  CreatePersonDto,
  UpdatePersonDto,
  CreatePlaceDto,
  UpdatePlaceDto,
  CreateBannedDto,
  UpdateBannedDto,
  PersonBanStatus,
  ApproveBannedPlaceDto,
  BannedHistory,
  CheckActiveBansResponse,
  BannedPlaceStatus,
} from "@/lib/types";

// Query Keys
export const queryKeys = {
  authMe: ["auth", "me"] as const,
  persons: ["persons"] as const,
  person: (id: string) => ["persons", id] as const,
  places: ["places"] as const,
  place: (id: string) => ["places", id] as const,
  banneds: ["banneds"] as const,
  banned: (id: string) => ["banneds", id] as const,
  personBans: (personId: string) => ["banneds", "person", personId] as const,
  personBanStatus: (personId: string) =>
    ["banneds", "person", personId, "active"] as const,
  pendingBanneds: ["banneds", "pending"] as const,
  approvalQueueBanneds: ["banneds", "approval-queue"] as const,
  bannedHistory: (bannedId: string) => ["banneds", bannedId, "history"] as const,
  personSearch: (query: string) => ["persons", "search", query] as const,
  dashboardSummary: ["dashboard", "summary"] as const,
};

// Persons Hooks
export function usePersons(
  filters?: {
    gender?: "all" | "Male" | "Female" | null;
    search?: string;
    sortBy?: "newest-first" | "oldest-first" | "name-asc" | "name-desc";
    page?: number;
    limit?: number;
  },
  options?: { enabled?: boolean; staleTimeMs?: number },
) {
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
      
      if (typeof filters?.page === "number" && filters.page > 0) {
        params.append("page", String(filters.page));
      }
      if (typeof filters?.limit === "number" && filters.limit > 0) {
        params.append("limit", String(filters.limit));
      }

      const queryString = params.toString();
      const url = queryString ? `/persons?${queryString}` : "/persons";
      return api.get<{ items: Person[]; total: number; page: number; limit: number; hasNext: boolean }>(url);
    },
    retry: 3,
    retryDelay: 1000,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTimeMs ?? 2 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000, // 5 minutos - los datos son frescos por 5 minutos
    refetchOnMount: false, // No refetchear al montar si los datos están frescos
    refetchOnWindowFocus: false, // No refetchear al enfocar ventana si los datos están frescos
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonDto) => api.post<Person>("/persons", data),
    onSuccess: (data) => {
      // Set the individual person cache first
      queryClient.setQueryData(queryKeys.person(data.id), data);
      
      // Update cache with server response (includes auto-generated image, etc.)
      // Add the new person to the beginning of lists (assuming newest-first sort)
      queryClient.setQueriesData<{ items: Person[]; total: number; page: number; limit: number; hasNext: boolean }>(
        { 
          queryKey: queryKeys.persons,
          exact: false,
          predicate: (query) => {
            const key = query.queryKey;
            // Exclude individual person queries: ["persons", id]
            if (Array.isArray(key) && key.length === 2 && key[0] === "persons") {
              const secondKey = key[1];
              const isListKey = secondKey === "filtered" || secondKey === "search";
              return isListKey;
            }
            return true;
          }
        },
        (old) => {
          if (!old || !('items' in old) || !Array.isArray(old.items)) {
            return old;
          }
          
          // Add new person at the beginning (assuming newest-first sort)
          // Only add if we're on page 1, otherwise let invalidation handle it
          const isPageOne = old.page === 1;
          
          if (isPageOne) {
            // If the list is full, remove the last item to maintain page size
            const updatedItems = [data, ...old.items];
            const shouldTrim = updatedItems.length > old.limit;
            const finalItems = shouldTrim ? updatedItems.slice(0, old.limit) : updatedItems;
            
            return {
              ...old,
              items: finalItems,
              total: old.total + 1,
            };
          }
          
          // If not on page 1, just increment total and let invalidation refetch
          return {
            ...old,
            total: old.total + 1,
          };
        }
      );
      
      // Invalidate only inactive queries to sync in background
      // Don't refetch active queries immediately to avoid flickering
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.persons,
        refetchType: 'inactive',
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.personSearch,
        refetchType: 'inactive',
      });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonDto }) =>
      api.patch<Person>(`/persons/${id}`, data),
    onSuccess: (data, { id }) => {
      // Update specific person cache immediately
      queryClient.setQueryData(queryKeys.person(id), data);
      
      // Update all persons list queries directly (including filtered ones)
      // Exclude individual person queries (["persons", id]) which return Person objects, not paginated lists
      queryClient.setQueriesData<{ items: Person[]; total: number; page: number; limit: number; hasNext: boolean }>(
        { 
          queryKey: queryKeys.persons,
          exact: false,
          predicate: (query) => {
            const key = query.queryKey;
            // Exclude individual person queries: ["persons", id] where id is a UUID
            // Include: ["persons"], ["persons", "filtered", {...}], ["persons", "search", ...]
            if (Array.isArray(key) && key.length === 2 && key[0] === "persons") {
              const secondKey = key[1];
              const isListKey = secondKey === "filtered" || secondKey === "search";
              return isListKey;
            }
            return true;
          }
        },
        (old) => {
          if (!old || !('items' in old) || !Array.isArray(old.items)) {
            return old;
          }
          
          // Update the person in the items array
          const updatedItems = old.items.map((person) =>
            person.id === id ? data : person
          );
          
          return {
            ...old,
            items: updatedItems,
          };
        }
      );
      
      // Invalidate only inactive queries to sync in background
      // Don't refetch active queries immediately to avoid flickering
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.persons,
        refetchType: 'inactive',
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.personSearch,
        refetchType: 'inactive',
      });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/persons/${id}`),
    onSuccess: (_, id) => {
      // Remove specific person from cache
      queryClient.removeQueries({ queryKey: queryKeys.person(id) });
      
      // Update all persons list queries directly (remove person from lists)
      queryClient.setQueriesData<{ items: Person[]; total: number; page: number; limit: number; hasNext: boolean }>(
        { 
          queryKey: queryKeys.persons,
          exact: false,
          predicate: (query) => {
            const key = query.queryKey;
            // Exclude individual person queries: ["persons", id]
            if (Array.isArray(key) && key.length === 2 && key[0] === "persons") {
              const secondKey = key[1];
              const isListKey = secondKey === "filtered" || secondKey === "search";
              return isListKey;
            }
            return true;
          }
        },
        (old) => {
          if (!old || !('items' in old) || !Array.isArray(old.items)) {
            return old;
          }
          
          // Remove the deleted person from the items array
          const updatedItems = old.items.filter((person) => person.id !== id);
          const newTotal = Math.max(0, old.total - 1);
          
          return {
            ...old,
            items: updatedItems,
            total: newTotal,
          };
        }
      );
      
      // Invalidate only inactive queries to sync in background
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.persons,
        refetchType: 'inactive',
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.personSearch,
        refetchType: 'inactive',
      });
    },
  });
}

// Places Hooks
export function usePlaces(
  options?: { page?: number; limit?: number; search?: string; enabled?: boolean; staleTimeMs?: number },
) {
  const hasPagination = typeof options?.page === 'number' || typeof options?.limit === 'number' || (options?.search && options.search.trim());
  
  const queryKey = useMemo(() => {
    if (hasPagination) {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const search = options?.search || '';
      return [...queryKeys.places, 'paginated', page, limit, search];
    }
    return queryKeys.places;
  }, [hasPagination, options?.page, options?.limit, options?.search]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (hasPagination) {
        const params = new URLSearchParams();
        if (typeof options?.page === 'number' && options.page > 0) {
          params.append('page', String(options.page));
        }
        if (typeof options?.limit === 'number' && options.limit > 0) {
          params.append('limit', String(options.limit));
        }
        if (options?.search && options.search.trim()) {
          params.append('search', options.search.trim());
        }
        const queryString = params.toString();
        const url = queryString ? `/places?${queryString}` : "/places";
        return api.get<{ items: Place[]; total: number; page: number; limit: number; hasNext: boolean }>(url);
      } else {
        // Sin paginación: retornar array directamente para compatibilidad
        return api.get<Place[]>("/places");
      }
    },
    retry: 3,
    retryDelay: 1000,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTimeMs ?? 2 * 60 * 1000,
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

// Banneds Hooks
export function useBanneds(sortBy?: string, options?: { enabled?: boolean; staleTimeMs?: number }) {
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
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTimeMs ?? 2 * 60 * 1000,
  });
}

export function useBanned(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.banned(id),
    queryFn: () => api.get<Banned>(`/banneds/${id}`),
    enabled: options?.enabled !== undefined ? options.enabled && !!id : !!id,
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

export function usePendingBanneds(
  sortBy?: string,
  options?: { page?: number; limit?: number; search?: string; enabled?: boolean; staleTimeMs?: number },
) {
  // Memoizar el queryKey para evitar recrearlo en cada render
  const queryKey = useMemo(() => {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search || '';
    
    return sortBy
      ? [...queryKeys.pendingBanneds, 'sorted', sortBy, page, limit, search]
      : [...queryKeys.pendingBanneds, page, limit, search];
  }, [sortBy, options?.page, options?.limit, options?.search]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);
      if (options?.search && options.search.trim()) {
        params.append('search', options.search.trim());
      }
      if (typeof options?.page === 'number' && options.page > 0) {
        params.append('page', String(options.page));
      }
      if (typeof options?.limit === 'number' && options.limit > 0) {
        params.append('limit', String(options.limit));
      }
      const queryString = params.toString();
      const url = queryString
        ? `/banneds/pending?${queryString}`
        : "/banneds/pending";
      return api.get<{ items: Banned[]; total: number; page: number; limit: number; hasNext: boolean }>(url);
    },
    retry: 3,
    retryDelay: 1000,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTimeMs ?? 2 * 60 * 1000,
  });
}

export function useApprovalQueueBanneds(
  sortBy?: string,
  createdBy?: string | null,
  options?: { page?: number; limit?: number; search?: string; enabled?: boolean; staleTimeMs?: number },
) {
  // Memoizar el queryKey para evitar recrearlo en cada render
  // Esto previene que React Query cree múltiples observadores para la misma query
  const queryKey = useMemo(() => {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search || '';
    const creator = createdBy || 'all';
    
    return sortBy
      ? [...queryKeys.approvalQueueBanneds, 'sorted', sortBy, creator, page, limit, search]
      : [...queryKeys.approvalQueueBanneds, creator, page, limit, search];
  }, [sortBy, createdBy, options?.page, options?.limit, options?.search]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);
      if (createdBy) params.append('createdBy', createdBy);
      if (options?.search && options.search.trim()) {
        params.append('search', options.search.trim());
      }
      if (typeof options?.page === 'number' && options.page > 0) {
        params.append('page', String(options.page));
      }
      if (typeof options?.limit === 'number' && options.limit > 0) {
        params.append('limit', String(options.limit));
      }
      const queryString = params.toString();
      const url = queryString
        ? `/banneds/approval-queue?${queryString}`
        : "/banneds/approval-queue";
      return api.get<{ items: Banned[]; total: number; page: number; limit: number; hasNext: boolean }>(url);
    },
    retry: 3,
    retryDelay: 1000,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTimeMs ?? 2 * 60 * 1000,
  });
}

export function useApproveBannedPlace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userPlaceId = user?.placeId;

  return useMutation({
    mutationFn: ({
      bannedId,
      data,
    }: {
      bannedId: string;
      data: ApproveBannedPlaceDto;
    }) => api.post<Banned>(`/banneds/${bannedId}/approve`, data),
    
    // Actualización optimista: actualizar UI inmediatamente
    onMutate: async ({ bannedId, data }) => {
      // Cancelar cualquier refetch en progreso para evitar sobrescribir nuestra actualización optimista
      await queryClient.cancelQueries({ queryKey: queryKeys.approvalQueueBanneds });
      await queryClient.cancelQueries({ queryKey: queryKeys.banned(bannedId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pendingBanneds });

      // Guardar el estado anterior para poder revertirlo si falla
      const previousApprovalQueue = queryClient.getQueriesData({ queryKey: queryKeys.approvalQueueBanneds });
      const previousBanned = queryClient.getQueryData(queryKeys.banned(bannedId));
      const previousPending = queryClient.getQueryData(queryKeys.pendingBanneds);

      // Actualizar optimistamente el banned específico
      queryClient.setQueryData(queryKeys.banned(bannedId), (old: Banned | undefined) => {
        if (!old) return old;
        const updatedBannedPlaces = old.bannedPlaces?.map(bp => {
          if (bp.placeId === data.placeId) {
            if (data.approved) {
              return {
                ...bp,
                status: 'approved' as BannedPlaceStatus,
                approvedByUserId: null, // Se actualizará con datos del servidor
                approvedAt: null, // Se actualizará con datos del servidor
                rejectedByUserId: null,
                rejectedAt: null,
              };
            } else {
              // Si se rechaza, el place se eliminará del array (se maneja en onSuccess)
              return null;
            }
          }
          return bp;
        }).filter(Boolean) as BannedPlace[] | undefined;

        return {
          ...old,
          bannedPlaces: updatedBannedPlaces,
        };
      });

      // Actualizar optimistamente la cola de aprobación
      // Filtrar los bans que ya no tienen lugares pendientes para el place del usuario
      queryClient.setQueriesData<{ items: Banned[]; total: number; page: number; limit: number; hasNext: boolean }>(
        { queryKey: queryKeys.approvalQueueBanneds },
        (old) => {
          if (!old) return old;
          
          // Actualizar los items y filtrar los que ya no tienen lugares pendientes
          const updatedItems = old.items
            .map(banned => {
              if (banned.id === bannedId) {
                const updatedBannedPlaces = banned.bannedPlaces?.map(bp => {
                  if (bp.placeId === data.placeId) {
                    if (data.approved) {
                      return {
                        ...bp,
                        status: 'approved' as BannedPlaceStatus,
                      };
                    } else {
                      return null;
                    }
                  }
                  return bp;
                }).filter(Boolean) as BannedPlace[] | undefined;

                return {
                  ...banned,
                  bannedPlaces: updatedBannedPlaces,
                };
              }
              return banned;
            })
            // Filtrar los bans que ya no tienen lugares pendientes para el place del usuario
            .filter(banned => {
              if (!userPlaceId) return true; // Si no hay userPlaceId, mantener todos
              
              // Verificar si este ban tiene lugares pendientes para el place del usuario
              const hasPendingPlaces = banned.bannedPlaces?.some(
                bp => bp.placeId === userPlaceId && bp.status === 'pending'
              );
              return hasPendingPlaces;
            });

          // Calcular el nuevo total basado en los items filtrados
          return {
            ...old,
            items: updatedItems,
            total: Math.max(0, old.total - (old.items.length - updatedItems.length)),
          };
        }
      );

      // Retornar el contexto con los datos anteriores para el rollback
      return { previousApprovalQueue, previousBanned, previousPending, userPlaceId };
    },
    
    // Si la mutación es exitosa: actualizar con los datos reales del servidor
    onSuccess: async (data, { bannedId }) => {
      // Actualizar el cache con los datos reales del servidor
      queryClient.setQueryData(queryKeys.banned(bannedId), data);
      
      // Usar invalidateQueries con refetchType: 'active' para solo refetchear queries activas
      // Esto evita refetches duplicados y solo actualiza las queries que están siendo usadas
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.approvalQueueBanneds,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.pendingBanneds,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.bannedHistory(bannedId),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.banneds,
        refetchType: 'active',
      });
    },
    
    // Si la mutación FALLA: revertir los cambios optimistas
    onError: (error, variables, context) => {
      // Revertir al estado anterior
      if (context?.previousApprovalQueue) {
        context.previousApprovalQueue.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousBanned) {
        queryClient.setQueryData(queryKeys.banned(variables.bannedId), context.previousBanned);
      }
      if (context?.previousPending) {
        queryClient.setQueryData(queryKeys.pendingBanneds, context.previousPending);
      }
    },
    
    // Solo invalidar en caso de error para asegurar sincronización después del rollback
    onSettled: (data, error) => {
      // Solo invalidar si hubo un error para asegurar sincronización después del rollback
      // En caso de éxito, onSuccess ya maneja la invalidación
      if (error) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.approvalQueueBanneds,
          refetchType: 'active',
        });
      }
    },
  });
}

// Bulk approve banneds pending for head-manager's place with optional filters
export function useBulkApproveBanneds() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userPlaceId = user?.placeId;
  
  return useMutation({
    mutationFn: async (payload: { createdBy?: string; gender?: 'Male' | 'Female'; bannedIds?: string[]; placeIds?: string[]; maxBatchSize?: number }) => {
      return api.post<{ approvedCount: number; failedCount: number; failures?: Array<{ id: string; reason: string }> }>(
        "/banneds/approve/bulk",
        payload,
      );
    },
    
    // Actualización optimista: actualizar UI inmediatamente
    onMutate: async (payload) => {
      // Validar que tenemos userPlaceId
      if (!userPlaceId) {
        throw new Error('User placeId is required for bulk approval');
      }

      // Cancelar cualquier refetch en progreso para evitar sobrescribir nuestra actualización optimista
      await queryClient.cancelQueries({ queryKey: queryKeys.approvalQueueBanneds });
      await queryClient.cancelQueries({ queryKey: queryKeys.pendingBanneds });
      await queryClient.cancelQueries({ queryKey: queryKeys.banneds });

      // Guardar el estado anterior para poder revertirlo si falla
      const previousApprovalQueue = queryClient.getQueriesData({ queryKey: queryKeys.approvalQueueBanneds });
      const previousPending = queryClient.getQueryData(queryKeys.pendingBanneds);
      const previousBanneds = queryClient.getQueryData(queryKeys.banneds);

      // Actualizar optimistamente todas las queries de approvalQueueBanneds
      queryClient.setQueriesData<{ items: Banned[]; total: number; page: number; limit: number; hasNext: boolean }>(
        { queryKey: queryKeys.approvalQueueBanneds },
        (old) => {
          if (!old) return old;
          
          // Filtrar y actualizar los bans que coinciden con los filtros
          const updatedItems = old.items
            .map(banned => {
              // Verificar si este ban coincide con los filtros del payload
              const matchesFilters = 
                (!payload.createdBy || banned.createdByUserId === payload.createdBy) &&
                (!payload.gender || banned.person?.gender === payload.gender) &&
                (!payload.bannedIds || payload.bannedIds.length === 0 || payload.bannedIds.includes(banned.id));

              if (!matchesFilters) return banned;

              // Verificar si este ban tiene lugares pendientes para el place del usuario
              const hasPendingPlacesForUserPlace = banned.bannedPlaces?.some(
                bp => bp.placeId === userPlaceId && bp.status === 'pending'
              );

              if (!hasPendingPlacesForUserPlace) return banned;

              // Actualizar los lugares pendientes del place del usuario
              const updatedBannedPlaces = banned.bannedPlaces?.map(bp => {
                if (bp.placeId === userPlaceId && bp.status === 'pending') {
                  return {
                    ...bp,
                    status: 'approved' as BannedPlaceStatus,
                    approvedByUserId: null, // Se actualizará con datos del servidor
                    approvedAt: null,
                    rejectedByUserId: null,
                    rejectedAt: null,
                  };
                }
                return bp;
              });

              return {
                ...banned,
                bannedPlaces: updatedBannedPlaces,
              };
            })
            // Filtrar los bans que ya no tienen lugares pendientes para el place del usuario
            .filter(banned => {
              const hasPendingPlaces = banned.bannedPlaces?.some(
                bp => bp.placeId === userPlaceId && bp.status === 'pending'
              );
              return hasPendingPlaces;
            });

          // Calcular el nuevo total basado en los items filtrados
          // Nota: El total real se ajustará cuando se invalide la query
          return {
            ...old,
            items: updatedItems,
            total: Math.max(0, old.total - (old.items.length - updatedItems.length)),
          };
        }
      );

      // Retornar el contexto para rollback
      return { 
        previousApprovalQueue, 
        previousPending, 
        previousBanneds,
        userPlaceId,
      };
    },
    
    // Si la mutación es exitosa: refetch queries para sincronizar con el backend
    // El backend garantiza que los datos están disponibles antes de retornar (verificación explícita)
    onSuccess: (data, variables, context) => {
      // Usar resetQueries para approvalQueueBanneds
      // resetQueries = removeQueries + refetch automático, evita duplicados
      queryClient.resetQueries({ 
        queryKey: queryKeys.approvalQueueBanneds,
        exact: false,
      });
      
      // Invalidar otras queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.pendingBanneds,
        refetchType: 'active',
      });
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.banneds,
        refetchType: 'active',
      });
      
      // Mostrar toast de éxito
      setTimeout(() => {
        toast({ 
          title: "Bulk approval completed", 
          description: `Approved: ${data.approvedCount} • Failed: ${data.failedCount}`,
          duration: 5000,
        });
      }, 100);
    },
    
    // Si la mutación FALLA: revertir los cambios optimistas
    onError: (error: any, variables, context) => {
      // Revertir al estado anterior
      if (context?.previousApprovalQueue) {
        context.previousApprovalQueue.forEach(([queryKey, data]) => {
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      if (context?.previousPending !== undefined) {
        queryClient.setQueryData(queryKeys.pendingBanneds, context.previousPending);
      }
      if (context?.previousBanneds !== undefined) {
        queryClient.setQueryData(queryKeys.banneds, context.previousBanneds);
      }
      
      // Mostrar toast de error
      toast({ 
        title: "Bulk approval error", 
        description: error?.message || "Please try again", 
        variant: "destructive" 
      });
    },
    
    // Solo invalidar en caso de error para asegurar sincronización después del rollback
    onSettled: (data, error) => {
      // Solo invalidar si hubo un error para asegurar sincronización después del rollback
      // En caso de éxito, onSuccess ya maneja la invalidación
      if (error) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.approvalQueueBanneds,
          refetchType: 'active',
        });
      }
    },
  });
}

export function useBannedHistory(bannedId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.bannedHistory(bannedId),
    queryFn: () => api.get<BannedHistory[]>(`/banneds/${bannedId}/history`),
    enabled: options?.enabled !== undefined ? options.enabled && !!bannedId : !!bannedId,
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
    staleTime: Infinity, // Nunca considerar los datos como stale - solo se actualizarán cuando se invalide explícitamente
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false, // No refetchear al reconectar
    refetchInterval: false, // No refetchear automáticamente
  });
}

export function useDashboardSummary(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => api.get<{ totals: { totalPersons: number; activeBans: number; totalPlaces: number } }>("/dashboard/summary"),
    enabled,
    staleTime: 10 * 1000, // 10 segundos para forzar actualizaciones más frecuentes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
