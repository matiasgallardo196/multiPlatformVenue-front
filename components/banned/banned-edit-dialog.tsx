"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BannedForm } from "./banned-form";
import { updateBannedSchema, type UpdateBannedForm } from "@/lib/validations";
import { useBanned, usePlaces, useUpdateBanned } from "@/hooks/queries";

export function BannedEditDialog({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: banned } = useBanned(id);
  const updateBanned = useUpdateBanned();
  const { data: places = [] } = usePlaces();

  const form = useForm<UpdateBannedForm>({
    resolver: zodResolver(updateBannedSchema),
    mode: "onChange",
    defaultValues: {
      startingDate: "",
      endingDate: "",
      motive: "",
      placeIds: [] as any,
    },
  });

  useEffect(() => {
    if (banned) {
      form.reset({
        startingDate: banned.startingDate?.slice(0, 10) || "",
        endingDate: banned.endingDate?.slice(0, 10) || "",
        motive: banned.motive || "",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ban</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <BannedForm form={form as any} places={places} />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateBanned.isPending || !form.formState.isValid}
              >
                {updateBanned.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
