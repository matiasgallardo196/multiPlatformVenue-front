"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { UseFormReturn } from "react-hook-form";
import type { Person, Place } from "@/lib/types";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { X } from "lucide-react";

type IncidentFormValues = {
  personId: string;
  placeId: string;
  details?: string;
  photoBook?: string[];
};

export function IncidentForm({
  form,
  persons,
  places,
  onSubmit,
  onCancel,
  submitLabel,
  lockedPersonId,
  isSubmitting,
}: {
  form: UseFormReturn<IncidentFormValues>;
  persons: Person[];
  places: Place[];
  onSubmit: (values: IncidentFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  lockedPersonId?: string;
  isSubmitting?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_IMAGES = 8;
  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const current = form.getValues("photoBook") || [];

    const messages: string[] = [];
    if (current.length >= MAX_IMAGES) {
      form.setError("photoBook" as any, {
        type: "manual",
        message: `Máximo ${MAX_IMAGES} imágenes.`,
      });
      return;
    }

    const picked = Array.isArray(files) ? files : Array.from(files);
    const byType = picked.filter((f) => {
      const ok = ALLOWED_TYPES.has(f.type);
      if (!ok) messages.push(`Formato no permitido: ${f.name}`);
      return ok;
    });
    const bySize = byType.filter((f) => {
      const ok = f.size <= MAX_FILE_SIZE_BYTES;
      if (!ok) messages.push(`${f.name} supera ${MAX_FILE_SIZE_MB}MB`);
      return ok;
    });

    const remaining = Math.max(0, MAX_IMAGES - current.length);
    const toUpload = bySize.slice(0, remaining);
    if (bySize.length > toUpload.length)
      messages.push(`Solo se permiten ${MAX_IMAGES} imágenes en total.`);

    if (toUpload.length === 0) {
      if (messages.length) {
        form.setError("photoBook" as any, {
          type: "manual",
          message: messages.join(" \n "),
        });
      }
      return;
    }

    setIsUploading(true);
    setGlobalProgress(0);
    setFileProgress({});
    try {
      const settled = await Promise.allSettled(
        toUpload.map((file) =>
          uploadToCloudinary(file, {
            folder: undefined,
            onProgress: (p) => {
              setFileProgress((prev) => {
                const next = { ...prev, [file.name]: p };
                const values = Object.values(next);
                const avg = values.length
                  ? values.reduce((a, b) => a + b, 0) / values.length
                  : 0;
                setGlobalProgress(Math.round(avg));
                return next;
              });
            },
          })
        )
      );

      const successes = settled.filter(
        (r) => r.status === "fulfilled"
      ) as PromiseFulfilledResult<{ url: string; public_id: string }>[];
      const urls = successes.map((r) => r.value.url);
      if (urls.length > 0) {
        form.setValue("photoBook", [...current, ...urls], {
          shouldDirty: true,
        });
      }
      if (messages.length) {
        form.setError("photoBook" as any, {
          type: "manual",
          message: messages.join(" \n "),
        });
      } else {
        form.clearErrors("photoBook" as any);
      }
    } finally {
      setIsUploading(false);
      setGlobalProgress(0);
      setFileProgress({});
    }
  };

  const removeImageAt = (index: number) => {
    const current = form.getValues("photoBook") || [];
    const next = current.filter((_, i) => i !== index);
    form.setValue("photoBook", next, { shouldDirty: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {lockedPersonId ? (
          <input
            type="hidden"
            value={lockedPersonId}
            {...form.register("personId")}
          />
        ) : (
          <FormField
            control={form.control}
            name="personId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Person</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {persons.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {[p.name, p.lastName].filter(Boolean).join(" ") ||
                            p.nickname ||
                            "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="placeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Place</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select place" />
                  </SelectTrigger>
                  <SelectContent>
                    {places.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the incident" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photoBook"
          render={() => (
            <FormItem>
              <FormLabel>Photos</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Max. {MAX_IMAGES} images, up to {MAX_FILE_SIZE_MB}MB each.
                    Formats: JPG, PNG, WebP.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select images
                  </Button>

                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={globalProgress} />
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(fileProgress).map(([name, p]) => (
                          <div
                            key={name}
                            className="flex items-center justify-between text-xs text-muted-foreground"
                          >
                            <span className="truncate max-w-[200px]">
                              {name}
                            </span>
                            <span>{p}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(form.watch("photoBook") || []).map((url, idx) => (
                      <div key={idx} className="relative h-12 w-12">
                        <img
                          src={url}
                          alt="preview"
                          className="h-12 w-12 rounded object-cover border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImageAt(idx)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full border bg-background/80"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading || isSubmitting}>
            {isUploading ? "Uploading..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
