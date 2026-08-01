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
import { updateBiomarker } from "@/app/actions";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

type Biomarker = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  refLow: string | null;
  refHigh: string | null;
};

export function EditBiomarkerDialog({ biomarker }: { biomarker: Biomarker }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await updateBiomarker(formData);
                toast.success("Biomarker updated");
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to update biomarker");
              }
            });
          }}
        >
          <input type="hidden" name="id" value={biomarker.id} />
          <DialogHeader>
            <DialogTitle>Edit biomarker</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" name="name" defaultValue={biomarker.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unit">Unit</Label>
              <Input id="edit-unit" name="unit" defaultValue={biomarker.unit} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category (optional)</Label>
              <Input id="edit-category" name="category" defaultValue={biomarker.category ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-refLow">Reference low</Label>
                <Input
                  id="edit-refLow"
                  name="refLow"
                  type="number"
                  step="any"
                  defaultValue={biomarker.refLow ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-refHigh">Reference high</Label>
                <Input
                  id="edit-refHigh"
                  name="refHigh"
                  type="number"
                  step="any"
                  defaultValue={biomarker.refHigh ?? ""}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
