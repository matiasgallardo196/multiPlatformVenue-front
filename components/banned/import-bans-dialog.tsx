"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, CheckCircle2, ArrowRight } from "lucide-react";
import { PlaceCombobox } from "@/components/place/place-combobox";
import { useImportBans } from "@/hooks/queries";
import { useToast } from "@/hooks/use-toast";
import { importBansSchema, type ImportBansForm } from "@/lib/validations";
import type { ImportBansResult } from "@/lib/types";

export function ImportBansDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ImportBansResult | null>(null);
  const importBans = useImportBans();

  const form = useForm<ImportBansForm>({
    resolver: zodResolver(importBansSchema),
    defaultValues: {
      sourcePlaceId: undefined,
      targetPlaceId: undefined,
      filter: "active_only",
    },
  });

  const onSubmit = async (values: ImportBansForm) => {
    try {
      const data = await importBans.mutateAsync(values);
      setResult(data);
      toast({
        title: "Import completed",
        description: `${data.imported} bans imported, ${data.skipped} skipped.`,
      });
    } catch (error: any) {
      // error already handled in mutation onError
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      form.reset();
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Import ban list</DialogTitle>
          <DialogDescription>
            Copy all approved bans from one venue into another as{" "}
            <strong>pending</strong>. The target venue&apos;s Head Manager will
            review and approve them from their approval queue.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-2 space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Import completed</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 space-y-1 text-sm">
                  <li>
                    <span className="font-medium">{result.imported}</span> bans
                    imported as pending
                  </li>
                  <li>
                    <span className="font-medium">{result.skipped}</span> already
                    existed and were skipped
                  </li>
                  <li>
                    <span className="font-medium">{result.personsGranted}</span>{" "}
                    persons granted access to target venue
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="sourcePlaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source venue</FormLabel>
                    <FormControl>
                      <PlaceCombobox
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select source venue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-center text-muted-foreground">
                <ArrowRight className="h-4 w-4" />
              </div>

              <FormField
                control={form.control}
                name="targetPlaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target venue</FormLabel>
                    <FormControl>
                      <PlaceCombobox
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select target venue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Which bans to import</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active_only">
                          Active bans only (within date range)
                        </SelectItem>
                        <SelectItem value="all">
                          All approved bans (including expired)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  disabled={importBans.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={importBans.isPending || !form.formState.isValid}
                >
                  {importBans.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
