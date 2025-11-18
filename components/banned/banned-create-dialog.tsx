"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createBannedSchema, type CreateBannedForm } from "@/lib/validations";
import { useCreateBanned, usePlaces } from "@/hooks/queries";
import { useRouter } from "next/navigation";
import { BannedForm } from "./banned-form";
import { useAuth } from "@/hooks/use-auth";

export function BannedCreateDialog({
  children,
  personId,
  defaultPlaceId,
  redirectOnSuccess,
}: {
  children: React.ReactNode;
  personId: string;
  defaultPlaceId?: string;
  redirectOnSuccess?: boolean;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const createBanned = useCreateBanned();
  const { data: places = [] } = usePlaces({ enabled: open });
  const router = useRouter();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Preseleccionar el lugar del usuario si existe y no hay defaultPlaceId
  const userPlaceId = user?.placeId ?? null;
  const initialPlaceIds = defaultPlaceId 
    ? [defaultPlaceId] 
    : (userPlaceId ? [userPlaceId] : []);

  const form = useForm<CreateBannedForm>({
    resolver: zodResolver(createBannedSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      personId,
      incidentNumber: undefined as any,
      startingDate: today,
      endingDate: tomorrow,
      motive: [],
      peopleInvolved: "",
      incidentReport: "",
      actionTaken: "",
      policeNotified: false,
      policeNotifiedDate: "",
      policeNotifiedTime: "",
      policeNotifiedEvent: "",
      placeIds: initialPlaceIds,
    },
  });

  // Asegurar que el place del usuario esté siempre presente si no hay defaultPlaceId
  useEffect(() => {
    if (!defaultPlaceId && userPlaceId && open) {
      const currentPlaceIds = form.getValues("placeIds") || [];
      if (!currentPlaceIds.includes(userPlaceId)) {
        form.setValue("placeIds", [userPlaceId, ...currentPlaceIds], { 
          shouldDirty: false, 
          shouldValidate: true 
        });
      }
    }
  }, [defaultPlaceId, userPlaceId, open, form]);

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
        setNavigating(true);
        router.push(`/banneds/${created.id}`);
      } else {
        setOpen(false);
      }
    } catch (error: any) {
      const msg = (error && error.message) ? String(error.message) : "Failed to create ban. Please try again.";
      const isActiveConflict = /active ban/i.test(msg);
      const isIncidentDuplicate = /incident number/i.test(msg);
      toast({
        title: isIncidentDuplicate
          ? "Incident number already exists"
          : isActiveConflict
          ? "Ban already active"
          : "Error",
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
          <div className="flex flex-col gap-2">
            <DialogTitle>Create Ban</DialogTitle>
            <DialogDescription>
              Create a new ban record for a person with incident details.
            </DialogDescription>
          </div>
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
              <BannedForm
                form={form as any}
                places={places}
                lockedPlaceId={defaultPlaceId || userPlaceId || undefined}
              />
            </form>
          </Form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={createBanned.isPending || navigating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={
              createBanned.isPending ||
              navigating ||
              !form.formState.isValid
            }
          >
            {createBanned.isPending
              ? "Saving..."
              : navigating
              ? "Navigating..."
              : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
