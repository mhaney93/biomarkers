"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { renameCategory } from "@/app/actions";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

export function RenameCategoryDialog({ category, group }: { category: string; group?: string | null }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
                await renameCategory(formData);
                const newCategory = String(formData.get("newCategory") ?? "").trim();
                toast.success("Category renamed");
                setOpen(false);
                router.replace(
                  group
                    ? `/groups/${encodeURIComponent(group)}/categories/${encodeURIComponent(newCategory)}`
                    : `/categories/${encodeURIComponent(newCategory)}`
                );
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to rename category");
              }
            });
          }}
        >
          <input type="hidden" name="oldCategory" value={category} />
          {group ? <input type="hidden" name="group" value={group} /> : null}
          <DialogHeader>
            <DialogTitle>Rename category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="newCategory">Category name</Label>
            <Input id="newCategory" name="newCategory" defaultValue={category} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
