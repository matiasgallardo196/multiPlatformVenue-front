"use client";

import { useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BannedForm } from "./banned-form";
import { createBannedSchema, type CreateBannedForm } from "@/lib/validations";
import { useCreateBanned, usePlaces } from "@/hooks/queries";
import { PersonCombobox } from "@/components/person/person-combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BannedCreateFullDialog({
  children,
  redirectOnSuccess = false,
}: {
  children: React.ReactNode;
  redirectOnSuccess?: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const createBanned = useCreateBanned();
  const { data: places = [] } = usePlaces();
  const router = useRouter();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const form = useForm<CreateBannedForm>({
    resolver: zodResolver(createBannedSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      personId: "",
      incidentNumber: undefined as any,
      startingDate: today,
      endingDate: today,
      motive: [],
      peopleInvolved: "",
      incidentReport: "",
      actionTaken: "",
      policeNotified: false,
      policeNotifiedDate: "",
      policeNotifiedTime: "",
      policeNotifiedEvent: "",
      placeIds: [],
    },
  });

  const onSubmit = async (values: CreateBannedForm) => {
    try {
      const created = await createBanned.mutateAsync({
        personId: values.personId,
        incidentNumber: values.incidentNumber,
        startingDate: values.startingDate,
        endingDate: values.endingDate,
        motive: values.motive,
        peopleInvolved:
          values.peopleInvolved && values.peopleInvolved.trim().length > 0
            ? values.peopleInvolved.trim()
            : undefined,
        incidentReport:
          values.incidentReport && values.incidentReport.trim().length > 0
            ? values.incidentReport.trim()
            : undefined,
        actionTaken:
          values.actionTaken && values.actionTaken.trim().length > 0
            ? values.actionTaken.trim()
            : undefined,
        policeNotified: values.policeNotified,
        policeNotifiedDate:
          values.policeNotified && values.policeNotifiedDate
            ? values.policeNotifiedDate
            : undefined,
        policeNotifiedTime:
          values.policeNotified && values.policeNotifiedTime
            ? values.policeNotifiedTime
            : undefined,
        policeNotifiedEvent:
          values.policeNotified && values.policeNotifiedEvent
            ? values.policeNotifiedEvent.trim()
            : undefined,
        placeIds: values.placeIds,
      });
      toast({ title: "Success", description: "Ban created successfully." });
      if (redirectOnSuccess) {
        router.push(`/banneds/${created.id}`);
      } else {
        setOpen(false);
      }
    } catch (error: any) {
      const msg = (error && error.message) ? String(error.message) : "Failed to create ban.";
      const isConflict = typeof msg === 'string' && /active ban/i.test(msg);
      toast({
        title: isConflict ? "Ban already active" : "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle>Create Ban</DialogTitle>
          <Form {...form}>
            <FormField
              control={form.control}
              name="incidentNumber"
              render={({ field }) => (
                <FormItem className="w-48">
                  <FormLabel className="text-sm">Incident N°</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter incident number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? undefined : Number(value));
                      }}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </Form>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 pr-2 -mr-2 custom-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <FormControl>
                    <PersonCombobox
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <BannedForm form={form as any} places={places} />
            </form>
          </Form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={!form.formState.isValid || createBanned.isPending}
          >
            {createBanned.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
