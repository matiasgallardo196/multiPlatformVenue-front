"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BannedForm } from "./banned-form";
import { updateBannedSchema, type UpdateBannedForm } from "@/lib/validations";
import { useBanned, usePlaces, useUpdateBanned } from "@/hooks/queries";

export function BannedEditDialog({
  children,
  id,
  onOpenChange: externalOnOpenChange,
}: {
  children: React.ReactNode;
  id: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    externalOnOpenChange?.(newOpen);
  };
  const { data: banned } = useBanned(id);
  const updateBanned = useUpdateBanned();
  const { data: places = [] } = usePlaces();

  const form = useForm<UpdateBannedForm>({
    resolver: zodResolver(updateBannedSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      incidentNumber: undefined as any,
      startingDate: "",
      endingDate: "",
      motive: [],
      peopleInvolved: "",
      incidentReport: "",
      actionTaken: "",
      policeNotified: false,
      policeNotifiedDate: "",
      policeNotifiedTime: "",
      policeNotifiedEvent: "",
      placeIds: [] as any,
    },
  });

  useEffect(() => {
    if (banned) {
      form.reset({
        incidentNumber: banned.incidentNumber || 0,
        startingDate: banned.startingDate?.slice(0, 10) || "",
        endingDate: banned.endingDate?.slice(0, 10) || "",
        motive: banned.motive || [],
        peopleInvolved: banned.peopleInvolved || "",
        incidentReport: banned.incidentReport || "",
        actionTaken: banned.actionTaken || "",
        policeNotified: banned.policeNotified || false,
        policeNotifiedDate: banned.policeNotifiedDate
          ? banned.policeNotifiedDate.slice(0, 10)
          : "",
        policeNotifiedTime: banned.policeNotifiedTime || "",
        policeNotifiedEvent: banned.policeNotifiedEvent || "",
        // Preselect existing banned places
        placeIds: (banned.bannedPlaces || []).map((bp) => bp.placeId) as any,
      });
    }
  }, [banned, form]);

  const onSubmit = async (values: UpdateBannedForm) => {
    try {
      await updateBanned.mutateAsync({ id, data: values });
      toast({ title: "Success", description: "Ban updated successfully." });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ban.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        className="max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => {
          e.stopPropagation();
        }}
        onPointerDownOutside={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <DialogTitle>Edit Ban</DialogTitle>
            <DialogDescription>
              Update the ban record with new incident details or information.
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
            disabled={updateBanned.isPending || !form.formState.isValid}
          >
            {updateBanned.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
