"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
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
} from "@/lib/types"

// Query Keys
export const queryKeys = {
  persons: ["persons"] as const,
  person: (id: string) => ["persons", id] as const,
  places: ["places"] as const,
  place: (id: string) => ["places", id] as const,
  incidents: ["incidents"] as const,
  incident: (id: string) => ["incidents", id] as const,
  banneds: ["banneds"] as const,
  banned: (id: string) => ["banneds", id] as const,
  personBans: (personId: string) => ["banneds", "person", personId] as const,
  personBanStatus: (personId: string) => ["banneds", "person", personId, "active"] as const,
}

// Persons Hooks
export function usePersons() {
  return useQuery({
    queryKey: queryKeys.persons,
    queryFn: () => api.get<Person[]>("/persons"),
    retry: 3,
    retryDelay: 1000,
  })
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: queryKeys.person(id),
    queryFn: () => api.get<Person>(`/persons/${id}`),
    enabled: !!id,
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePersonDto) => api.post<Person>("/persons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons })
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonDto }) => api.patch<Person>(`/persons/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons })
      queryClient.invalidateQueries({ queryKey: queryKeys.person(id) })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/persons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons })
    },
  })
}

// Places Hooks
export function usePlaces() {
  return useQuery({
    queryKey: queryKeys.places,
    queryFn: () => api.get<Place[]>("/places"),
    retry: 3,
    retryDelay: 1000,
  })
}

export function usePlace(id: string) {
  return useQuery({
    queryKey: queryKeys.place(id),
    queryFn: () => api.get<Place>(`/places/${id}`),
    enabled: !!id,
  })
}

export function useCreatePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlaceDto) => api.post<Place>("/places", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places })
    },
  })
}

export function useUpdatePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlaceDto }) => api.patch<Place>(`/places/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places })
      queryClient.invalidateQueries({ queryKey: queryKeys.place(id) })
    },
  })
}

export function useDeletePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/places/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places })
    },
  })
}

// Incidents Hooks
export function useIncidents() {
  return useQuery({
    queryKey: queryKeys.incidents,
    queryFn: () => api.get<Incident[]>("/incidents"),
    retry: 3,
    retryDelay: 1000,
  })
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: queryKeys.incident(id),
    queryFn: () => api.get<Incident>(`/incidents/${id}`),
    enabled: !!id,
  })
}

export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIncidentDto) => api.post<Incident>("/incidents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents })
    },
  })
}

export function useUpdateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidentDto }) =>
      api.patch<Incident>(`/incidents/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents })
      queryClient.invalidateQueries({ queryKey: queryKeys.incident(id) })
    },
  })
}

export function useDeleteIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents })
    },
  })
}

// Banneds Hooks
export function useBanneds() {
  return useQuery({
    queryKey: queryKeys.banneds,
    queryFn: () => api.get<Banned[]>("/banneds"),
    retry: 3,
    retryDelay: 1000,
  })
}

export function useBanned(id: string) {
  return useQuery({
    queryKey: queryKeys.banned(id),
    queryFn: () => api.get<Banned>(`/banneds/${id}`),
    enabled: !!id,
  })
}

export function usePersonBans(personId: string) {
  return useQuery({
    queryKey: queryKeys.personBans(personId),
    queryFn: () => api.get<Banned[]>(`/banneds/person/${personId}`),
    enabled: !!personId,
  })
}

export function usePersonBanStatus(personId: string) {
  return useQuery({
    queryKey: queryKeys.personBanStatus(personId),
    queryFn: () => api.get<PersonBanStatus>(`/banneds/person/${personId}/active`),
    enabled: !!personId,
  })
}

export function useCreateBanned() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBannedDto) => api.post<Banned>("/banneds", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banneds })
    },
  })
}

export function useUpdateBanned() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBannedDto }) => api.patch<Banned>(`/banneds/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banneds })
      queryClient.invalidateQueries({ queryKey: queryKeys.banned(id) })
    },
  })
}

export function useDeleteBanned() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/banneds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banneds })
    },
  })
}
