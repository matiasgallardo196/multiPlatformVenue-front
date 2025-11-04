// Core API types based on the NestJS backend specification

export type BannedPlaceStatus = 'pending' | 'approved' | 'rejected';

export type BannedHistoryAction =
  | 'created'
  | 'updated'
  | 'approved'
  | 'rejected'
  | 'place_added'
  | 'place_removed'
  | 'dates_changed';

export interface Person {
  id: string;
  name: string | null;
  lastName: string | null;
  nickname: string | null;
  imagenProfileUrl: string[] | null;
  gender: "Male" | "Female" | null;
  incidents: Incident[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Place {
  id: string;
  name: string | null;
  city: string;
}

export interface Incident {
  id: string;
  details: string | null;
  photoBook: string[] | null;
  person?: Person | null;
  place?: Place | null;
}

export interface BannedPlace {
  bannedId: string;
  placeId: string;
  status: BannedPlaceStatus;
  approvedByUserId?: string | null;
  rejectedByUserId?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  place?: Place;
}

export interface Banned {
  id: string;
  incidentNumber: number;
  startingDate: string;
  endingDate: string | null;
  howlong: {
    years: string;
    months: string;
    days: string;
  } | null;
  motive: string[];
  peopleInvolved: string | null;
  incidentReport: string | null;
  actionTaken: string | null;
  policeNotified: boolean;
  policeNotifiedDate: string | null;
  policeNotifiedTime: string | null;
  policeNotifiedEvent: string | null;
  isActive: boolean;
  createdByUserId: string;
  lastModifiedByUserId?: string | null;
  requiresApproval: boolean;
  violationsCount?: number;
  violationDates?: string[];
  person?: Person;
  bannedPlaces?: BannedPlace[];
}

// DTO types for API requests
export interface CreatePersonDto {
  name?: string;
  lastName?: string;
  nickname?: string;
  imagenProfileUrl?: string[];
  gender: "Male" | "Female";
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
  city: string;
}

export interface UpdatePlaceDto {
  name?: string;
  city?: string;
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
  personId: string;
  incidentNumber: number;
  startingDate: string;
  endingDate: string;
  motive: string[];
  peopleInvolved?: string;
  incidentReport?: string;
  actionTaken?: string;
  policeNotified: boolean;
  policeNotifiedDate?: string;
  policeNotifiedTime?: string;
  policeNotifiedEvent?: string;
  placeIds: string[];
}

export interface UpdateBannedDto {
  incidentNumber?: number;
  startingDate?: string;
  endingDate?: string | null;
  motive?: string[];
  peopleInvolved?: string;
  incidentReport?: string;
  actionTaken?: string;
  policeNotified?: boolean;
  policeNotifiedDate?: string | null;
  policeNotifiedTime?: string | null;
  policeNotifiedEvent?: string | null;
}

export interface PersonBanStatus {
  personId: string;
  isBanned: boolean;
  activeCount: number;
}

export interface ActiveBanInfo {
  placeId: string;
  placeName: string;
  bannedId: string;
  startingDate: string;
  endingDate: string | null;
  status: BannedPlaceStatus;
}

export interface CheckActiveBansResponse {
  personId: string;
  activeBans: ActiveBanInfo[];
}

export interface ApproveBannedPlaceDto {
  placeId: string;
  approved: boolean;
}

export interface BannedHistory {
  id: string;
  bannedId: string;
  action: BannedHistoryAction;
  performedByUserId: string;
  performedAt: string;
  details?: any;
  placeId?: string | null;
  performedBy?: {
    id: string;
    userName: string;
    role: string;
  };
  place?: Place;
}

export interface CurrentUser {
  userId: string;
  userName: string;
  role: string;
}
