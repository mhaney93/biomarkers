// Scan images shown on a group's page. Files live in public/scans and are keyed by group name.
export type ScanImage = { src: string; alt: string; width: number; height: number; takenAt: string };

export const GROUP_SCAN_IMAGES: Record<string, ScanImage[]> = {
  "DEXA scan": [
    {
      src: "/scans/dexa-2025-03-23.png",
      alt: "BodySpec DEXA total body tissue scan (image not for diagnosis)",
      width: 156,
      height: 467,
      takenAt: "2025-03-23",
    },
  ],
};
