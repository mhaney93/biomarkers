import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { readingPhotos } from "@/db/schema";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Serves a progress photo. Viewing is public like the rest of the site; attaching and removing
// photos needs the password (actions.ts).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const { id } = await params;
  if (!UUID.test(id)) return notFound();
  const [photo] = await getDb()
    .select({ contentType: readingPhotos.contentType, dataBase64: readingPhotos.dataBase64 })
    .from(readingPhotos)
    .where(eq(readingPhotos.id, id));
  if (!photo) return notFound();
  return new Response(Buffer.from(photo.dataBase64, "base64"), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
