// Core API types based on the NestJS backend specification

export interface Person {
  id: string;
  name: string | null;
  lastName: string | null;
  nickname: string | null;
  imagenProfileUrl: string[] | null;
  gender: "Male" | "Female" | null;
  incidents: Incident[];
}

export interface Place {
  id: string;
  name: string | null;
}

export interface Incident {
  id: string;
  details: string | null;
  photoBook: string[] | null;
  person?: Person | null;
  place?: Place | null;
  banned: Banned | null;
}

export interface Banned {
  id: string;
  startingDate: string;
  endingDate: string | null;
  howlong: {
    years: string;
    months: string;
    days: string;
  } | null;
  motive: string | null;
  isActive: boolean;
  incident?: Incident;
  bannedPlaces?: {
    bannedId: string;
    placeId: string;
  }[];
}

// DTO types for API requests
export interface CreatePersonDto {
  name?: string;
  lastName?: string;
  nickname?: string;
  imagenProfileUrl?: string[];
  gender?: "Male" | "Female";
}

export interface UpdatePersonDto {
  name?: string;
  lastName?: string;
  nickname?: string;
  imagenProfileUrl?: string[];
  gender?: "Male" | "Female";
}

export interface CreatePlaceDto {
  name: string;
}

export interface UpdatePlaceDto {
  name?: string;
}

export interface CreateIncidentDto {
  personId: string;
  placeId: string;
  details?: string;
  photoBook?: string[];
}

export interface UpdateIncidentDto {
  personId?: string;
  placeId?: string;
  details?: string;
  photoBook?: string[];
}

export interface CreateBannedDto {
  incidentId: string;
  startingDate: string;
  endingDate: string;
  motive?: string;
  placeIds?: string[];
}

export interface UpdateBannedDto {
  startingDate?: string;
  endingDate?: string | null;
  motive?: string;
}

export interface PersonBanStatus {
  personId: string;
  isBanned: boolean;
  activeCount: number;
}

export interface CurrentUser {
  userId: string;
  userName: string;
  role: string;
}
