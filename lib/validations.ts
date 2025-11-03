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
  city: z.string().min(1, "City is required"),
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
    personId: z.string().min(1, "Person is required"),
    incidentNumber: z.number().int("Incident number must be an integer").min(1, "Incident number is required"),
    startingDate: z.string().min(1, "Starting date is required"),
    endingDate: z.string().min(1, "Ending date is required"),
    motive: z.array(z.string()).min(1, "At least one motive is required"),
    peopleInvolved: z.string().optional(),
    incidentReport: z.string().optional(),
    actionTaken: z.string().optional(),
    policeNotified: z.boolean(),
    policeNotifiedDate: z.string().optional(),
    policeNotifiedTime: z.string().optional(),
    policeNotifiedEvent: z.string().optional(),
    placeIds: z.array(z.string()).min(1, "At least one place is required"),
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
  )
  .superRefine((data, ctx) => {
    // Only validate police notification fields if policeNotified is true
    if (data.policeNotified) {
      if (!data.policeNotifiedDate || data.policeNotifiedDate.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date is required when police is notified.",
          path: ["policeNotifiedDate"],
        });
      }
      if (!data.policeNotifiedTime || data.policeNotifiedTime.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Time is required when police is notified.",
          path: ["policeNotifiedTime"],
        });
      }
      if (!data.policeNotifiedEvent || data.policeNotifiedEvent.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event is required when police is notified.",
          path: ["policeNotifiedEvent"],
        });
      }
    }
  });

export const updateBannedSchema = z
  .object({
    incidentNumber: z.number().int("Incident number must be an integer").optional(),
    startingDate: z.string().optional(),
    endingDate: z.string().nullable().optional(),
    motive: z.array(z.string()).optional(),
    peopleInvolved: z.string().optional(),
    incidentReport: z.string().optional(),
    actionTaken: z.string().optional(),
    policeNotified: z.boolean().optional(),
    policeNotifiedDate: z.string().nullable().optional(),
    policeNotifiedTime: z.string().nullable().optional(),
    policeNotifiedEvent: z.string().nullable().optional(),
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
  )
  .superRefine((data, ctx) => {
    // Only validate police notification fields if policeNotified is true
    if (data.policeNotified === true) {
      if (!data.policeNotifiedDate || (typeof data.policeNotifiedDate === 'string' && data.policeNotifiedDate.trim().length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date is required when police is notified.",
          path: ["policeNotifiedDate"],
        });
      }
      if (!data.policeNotifiedTime || (typeof data.policeNotifiedTime === 'string' && data.policeNotifiedTime.trim().length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Time is required when police is notified.",
          path: ["policeNotifiedTime"],
        });
      }
      if (!data.policeNotifiedEvent || (typeof data.policeNotifiedEvent === 'string' && data.policeNotifiedEvent.trim().length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event is required when police is notified.",
          path: ["policeNotifiedEvent"],
        });
      }
    }
  });

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
