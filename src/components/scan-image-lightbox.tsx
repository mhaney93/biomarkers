"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ScanImage } from "@/lib/scan-images";

// Thumbnail that opens the scan in a near-fullscreen overlay, upscaled to fit the viewport.
export function ScanImageLightbox({ img }: { img: ScanImage }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="block cursor-zoom-in rounded-sm" aria-label={`Enlarge ${img.alt}`}>
          <Image src={img.src} alt={img.alt} width={img.width} height={img.height} />
        </button>
      </DialogTrigger>
      <DialogContent className="w-max max-w-[calc(100vw-2rem)] p-2 pt-10 sm:max-w-[calc(100vw-2rem)]">
        <DialogTitle className="sr-only">{img.alt}</DialogTitle>
        <Image
          src={img.src}
          alt={img.alt}
          width={img.width}
          height={img.height}
          className="mx-auto w-auto max-w-full object-contain"
          style={{ height: "calc(100dvh - 5rem)" }}
        />
      </DialogContent>
    </Dialog>
  );
}
