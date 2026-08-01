"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteReading } from "@/app/actions";
import { X } from "lucide-react";
import { toast } from "sonner";

export function DeleteReadingButton({ id, biomarkerId }: { id: string; biomarkerId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await deleteReading(id, biomarkerId);
          toast.success("Reading deleted");
        });
      }}
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}
