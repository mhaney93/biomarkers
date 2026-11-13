"use client";

import { useRef, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addReadingPhoto, deleteReadingPhoto } from "@/app/actions";
import { MAX_PHOTO_BYTES } from "@/lib/photos";

const MAX_EDGE = 2048;

// Re-encodes the chosen image as a JPEG no larger than MAX_EDGE on its long side, which keeps
// phone photos under the upload limit and drops their EXIF data (location included).
async function downsize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read the photo"))), "image/jpeg", 0.85),
  );
}

// Progress photos on one reading: thumbnails that open full size, plus attach/remove controls for
// an unlocked session.
export function ReadingPhotos({
  readingId,
  biomarkerId,
  dateLabel,
  photoIds,
  canEdit,
}: {
  readingId: string;
  biomarkerId: string;
  dateLabel: string;
  photoIds: string[];
  canEdit: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const upload = (file: File) =>
    startTransition(async () => {
      try {
        const blob = await downsize(file);
        if (blob.size > MAX_PHOTO_BYTES) throw new Error("Photo is too large");
        const formData = new FormData();
        formData.set("readingId", readingId);
        formData.set("biomarkerId", biomarkerId);
        formData.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const result = await addReadingPhoto(formData);
        if (result.error) throw new Error(result.error);
        toast.success("Photo attached");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to attach photo");
      }
    });

  return (
    <div className="flex items-center gap-1.5">
      {photoIds.map((id) => (
        <Dialog key={id}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="block shrink-0 cursor-zoom-in rounded-sm"
              aria-label={`Open progress photo from ${dateLabel}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- served from the DB by /api/photos */}
              <img src={`/api/photos/${id}`} alt="" className="h-12 w-9 rounded-sm object-cover" loading="lazy" />
            </button>
          </DialogTrigger>
          <DialogContent className="w-max max-w-[calc(100vw-2rem)] p-2 pt-10 sm:max-w-[calc(100vw-2rem)]">
            <DialogTitle className="sr-only">Progress photo from {dateLabel}</DialogTitle>
            {/* eslint-disable-next-line @next/next/no-img-element -- served from the DB by /api/photos */}
            <img
              src={`/api/photos/${id}`}
              alt={`Progress photo from ${dateLabel}`}
              className="mx-auto w-auto max-w-full object-contain"
              style={{ height: "calc(100dvh - 7rem)" }}
            />
            {canEdit && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteReadingPhoto(id, biomarkerId);
                      toast.success("Photo removed");
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove photo
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ))}
      {canEdit && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            disabled={isPending}
            aria-label={`Attach a progress photo to ${dateLabel}`}
            title="Attach a progress photo"
            onClick={() => input.current?.click()}
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </Button>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload(file);
            }}
          />
        </>
      )}
    </div>
  );
}
