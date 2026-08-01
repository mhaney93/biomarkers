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
import { updateReading } from "@/app/actions";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

type Reading = {
  id: string;
  biomarkerId: string;
  value: string;
  takenAt: string;
  notes: string | null;
};

export function EditReadingDialog({
  reading,
  biomarkerName,
  unit,
}: {
  reading: Reading;
  biomarkerName: string;
  unit: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await updateReading(formData);
                toast.success("Reading updated");
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to update reading");
              }
            });
          }}
        >
          <input type="hidden" name="id" value={reading.id} />
          <input type="hidden" name="biomarkerId" value={reading.biomarkerId} />
          <DialogHeader>
            <DialogTitle>Edit reading — {biomarkerName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-value">Value{unit ? ` (${unit})` : ""}</Label>
              <Input
                id="edit-value"
                name="value"
                type="number"
                step="any"
                defaultValue={reading.value}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-takenAt">Date</Label>
              <Input
                id="edit-takenAt"
                name="takenAt"
                type="date"
                defaultValue={reading.takenAt}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes (optional)</Label>
              <Input
                id="edit-notes"
                name="notes"
                placeholder="Fasted, lab name, etc."
                defaultValue={reading.notes ?? ""}
              />
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
