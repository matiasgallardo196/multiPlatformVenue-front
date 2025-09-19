"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useRef, useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";

type PersonFormValues = {
  name?: string;
  lastName?: string;
  nickname?: string;
  imagenProfileUrl?: string[];
  gender?: "Male" | "Female";
};

export function PersonForm({
  form,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  form: UseFormReturn<PersonFormValues>;
  onSubmit: (values: PersonFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const MAX_IMAGES = 5;
  const MAX_FILE_SIZE_MB = 3;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const current = form.getValues("imagenProfileUrl") || [];

    // Validaciones previas
    const messages: string[] = [];
    if (current.length >= MAX_IMAGES) {
      form.setError("imagenProfileUrl" as any, {
        type: "manual",
        message: `Maximum ${MAX_IMAGES} images in total.`,
      });
      return;
    }

    const picked = Array.isArray(files) ? files : Array.from(files);
    const byType = picked.filter((f) => {
      const ok = ALLOWED_TYPES.has(f.type);
      if (!ok) messages.push(`Unsupported format: ${f.name}`);
      return ok;
    });
    const bySize = byType.filter((f) => {
      const ok = f.size <= MAX_FILE_SIZE_BYTES;
      if (!ok) messages.push(`${f.name} exceeds ${MAX_FILE_SIZE_MB}MB`);
      return ok;
    });

    const remaining = Math.max(0, MAX_IMAGES - current.length);
    const toUpload = bySize.slice(0, remaining);
    if (bySize.length > toUpload.length) {
      messages.push(`Only ${MAX_IMAGES} images allowed in total.`);
    }

    if (toUpload.length === 0) {
      if (messages.length) {
        form.setError("imagenProfileUrl" as any, {
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
      const failures = settled
        .map((r, i) => ({ r, i }))
        .filter((x) => x.r.status === "rejected")
        .map((x) => toUpload[x.i]);

      const urls = successes.map((r) => r.value.url);
      if (urls.length > 0) {
        form.setValue("imagenProfileUrl", [...current, ...urls], {
          shouldDirty: true,
        });
      }
      if (messages.length) {
        form.setError("imagenProfileUrl" as any, {
          type: "manual",
          message: messages.join(" \n "),
        });
      } else {
        form.clearErrors("imagenProfileUrl" as any);
      }

      if (urls.length > 0) {
        toast({
          title: "Images uploaded",
          description: `${urls.length} image(s) added.`,
        });
      }
      if (failures.length > 0) {
        setFailedFiles((prev) => [...prev, ...failures]);
        toast({
          title: "Upload error",
          description: `Couldn't upload ${failures.length} file(s). Please try again.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      setGlobalProgress(0);
      setFileProgress({});
    }
  };

  const removeImageAt = (index: number) => {
    const current = form.getValues("imagenProfileUrl") || [];
    const next = current.filter((_, i) => i !== index);
    form.setValue("imagenProfileUrl", next, { shouldDirty: true });
  };

  const retryFile = async (file: File) => {
    setIsUploading(true);
    setGlobalProgress(0);
    setFileProgress({});
    try {
      const result = await uploadToCloudinary(file, {
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
      });
      const current = form.getValues("imagenProfileUrl") || [];
      form.setValue("imagenProfileUrl", [...current, result.url], {
        shouldDirty: true,
      });
      setFailedFiles((prev) => prev.filter((f) => f.name !== file.name));
      toast({ title: "Image uploaded", description: `${file.name} added.` });
    } catch (e) {
      toast({
        title: "Upload error",
        description: `Couldn't upload ${file.name}.`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setGlobalProgress(0);
      setFileProgress({});
    }
  };

  const retryAll = async () => {
    if (failedFiles.length === 0) return;
    const files = [...failedFiles];
    setFailedFiles([]);
    await handleFiles(files);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="First name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last name</FormLabel>
              <FormControl>
                <Input placeholder="Last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nickname</FormLabel>
              <FormControl>
                <Input placeholder="Nickname" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagenProfileUrl"
          render={() => (
            <FormItem>
              <FormLabel>Profile photos</FormLabel>
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

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isDragging) setIsDragging(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const dt = e.dataTransfer;
                      const files: File[] = [];
                      if (dt.items) {
                        for (let i = 0; i < dt.items.length; i++) {
                          const item = dt.items[i];
                          if (item.kind === "file") {
                            const f = item.getAsFile();
                            if (f) files.push(f);
                          }
                        }
                      } else if (dt.files) {
                        for (let i = 0; i < dt.files.length; i++)
                          files.push(dt.files[i]);
                      }
                      if (files.length > 0) {
                        await handleFiles(files);
                      }
                    }}
                    className={`mt-2 flex h-24 w-full items-center justify-center rounded border border-dashed ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground">
                      Drag and drop images here
                    </span>
                  </div>
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

                  {failedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {failedFiles.length} failed file(s)
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={retryAll}
                        >
                          Retry all
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {failedFiles.map((file) => (
                          <div
                            key={file.name}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="truncate max-w-[200px] text-muted-foreground">
                              {file.name}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => retryFile(file)}
                            >
                              Retry
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(form.watch("imagenProfileUrl") || []).map((url, idx) => (
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
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
