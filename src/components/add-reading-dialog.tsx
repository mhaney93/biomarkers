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
import { addReading } from "@/app/actions";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function AddReadingDialog({
  biomarkerId,
  biomarkerName,
  unit,
  valueType = "number",
  trigger,
}: {
  biomarkerId: string;
  biomarkerName: string;
  unit: string | null;
  valueType?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
            Add reading
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await addReading(formData);
                toast.success("Reading added");
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to add reading");
              }
            });
          }}
        >
          <input type="hidden" name="biomarkerId" value={biomarkerId} />
          <DialogHeader>
            <DialogTitle>Add reading — {biomarkerName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {valueType === "duration" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input id="hours" name="hours" type="number" step="1" min="0" defaultValue="0" required autoFocus />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minutes">Minutes</Label>
                  <Input id="minutes" name="minutes" type="number" step="1" min="0" max="59" defaultValue="0" required />
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="value">Value{unit ? ` (${unit})` : ""}</Label>
                <Input id="value" name="value" type="number" step="any" required autoFocus />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="takenAt">Date</Label>
              <Input id="takenAt" name="takenAt" type="date" defaultValue={today} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" name="notes" placeholder="Fasted, lab name, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save reading"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
