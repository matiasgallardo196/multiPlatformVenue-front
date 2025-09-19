import { z } from "zod";

// Person validation schemas
export const createPersonSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  nickname: z.string().optional(),
  imagenProfileUrl: z.array(z.string().url("Invalid URL")).optional(),
  gender: z.enum(["Male", "Female"]).optional(),
});

export const updatePersonSchema = createPersonSchema.partial();

// Place validation schemas
export const createPlaceSchema = z.object({
  name: z.string().min(1, "Place name is required"),
});

export const updatePlaceSchema = createPlaceSchema.partial();

// Incident validation schemas
export const createIncidentSchema = z.object({
  personId: z.string().min(1, "Person is required"),
  placeId: z.string().min(1, "Place is required"),
  details: z.string().optional(),
  photoBook: z.array(z.string().url("Invalid URL")).optional(),
});

export const updateIncidentSchema = createIncidentSchema.partial();

// Banned validation schemas
export const createBannedSchema = z
  .object({
    incidentId: z.string().min(1, "Incident is required"),
    startingDate: z.string().min(1, "Starting date is required"),
    endingDate: z.string().min(1, "Ending date is required"),
    motive: z.string().optional(),
    placeIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Compare ISO dates lexicographically (yyyy-MM-dd)
      if (!data.startingDate || !data.endingDate) return true;
      return data.endingDate >= data.startingDate;
    },
    {
      path: ["endingDate"],
      message: "End date must be after start date.",
    }
  );

export const updateBannedSchema = z
  .object({
    startingDate: z.string().optional(),
    endingDate: z.string().nullable().optional(),
    motive: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startingDate || !data.endingDate) return true;
      return data.endingDate >= data.startingDate;
    },
    {
      path: ["endingDate"],
      message: "End date must be after start date.",
    }
  );

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  placeIds: z.array(z.string()).optional(),
});

export type CreatePersonForm = z.infer<typeof createPersonSchema>;
export type UpdatePersonForm = z.infer<typeof updatePersonSchema>;
export type CreatePlaceForm = z.infer<typeof createPlaceSchema>;
export type UpdatePlaceForm = z.infer<typeof updatePlaceSchema>;
export type CreateIncidentForm = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentForm = z.infer<typeof updateIncidentSchema>;
export type CreateBannedForm = z.infer<typeof createBannedSchema>;
export type UpdateBannedForm = z.infer<typeof updateBannedSchema>;
export type SearchForm = z.infer<typeof searchSchema>;
