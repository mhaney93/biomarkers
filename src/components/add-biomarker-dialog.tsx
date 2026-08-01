"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBiomarker } from "@/app/actions";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AddBiomarkerDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add biomarker
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await createBiomarker(formData);
                toast.success("Biomarker added");
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to add biomarker");
              }
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Add biomarker</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. LDL Cholesterol" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit (optional)</Label>
              <Input id="unit" name="unit" placeholder="e.g. mg/dL — leave blank for a plain count" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input id="category" name="category" placeholder="e.g. Lipid Panel" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="refLow">Reference low</Label>
                <Input id="refLow" name="refLow" type="number" step="any" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="refHigh">Reference high</Label>
                <Input id="refHigh" name="refHigh" type="number" step="any" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add biomarker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
