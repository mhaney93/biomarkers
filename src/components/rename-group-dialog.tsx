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
import { renameGroup } from "@/app/actions";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

export function RenameGroupDialog({ group }: { group: string }) {
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
                await renameGroup(formData);
                const newGroup = String(formData.get("newGroup") ?? "").trim();
                toast.success("Group renamed");
                setOpen(false);
                router.replace(`/groups/${encodeURIComponent(newGroup)}`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to rename group");
              }
            });
          }}
        >
          <input type="hidden" name="oldGroup" value={group} />
          <DialogHeader>
            <DialogTitle>Rename group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="newGroup">Group name</Label>
            <Input id="newGroup" name="newGroup" defaultValue={group} required />
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
