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
import { updatePlaceSchema, type UpdatePlaceForm } from "@/lib/validations";
import { usePlace, useUpdatePlace } from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PlaceEditDialog({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: place } = usePlace(id);
  const updatePlace = useUpdatePlace();
  const { isHeadManager } = useAuth();

  const form = useForm<UpdatePlaceForm>({
    resolver: zodResolver(updatePlaceSchema),
    defaultValues: {
      name: "",
      city: "",
      placeEmail: "",
    },
  });

  useEffect(() => {
    if (place) {
      form.reset({ 
        name: place.name || "", 
        city: place.city || "",
        placeEmail: place.placeEmail || "",
      });
    }
  }, [place, form]);

  const onSubmit = async (values: UpdatePlaceForm) => {
    try {
      await updatePlace.mutateAsync({
        id,
        data: {
          name: values.name,
          city: values.city,
          placeEmail: values.placeEmail,
        },
      });
      toast({ title: "Success", description: "Place updated successfully." });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update place. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Place</DialogTitle>
          <DialogDescription>
            Update the place information including name, city, and email.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Place name" {...field} disabled={isHeadManager} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City name" {...field} disabled={isHeadManager} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="placeEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Place Email
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This will be the email used to send baring notices</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="place@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlace.isPending}>
                {updatePlace.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
