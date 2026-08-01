"use server";

import { getDb } from "@/db";
import { biomarkers, readings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { AUTH_COOKIE, getAuthToken, getExpectedToken, requireAuth } from "@/lib/auth";

export async function unlock(_prevState: { error: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");

  const [actual, expected] = await Promise.all([getAuthToken(password), getExpectedToken()]);
  if (actual !== expected) {
    return { error: "Incorrect password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return { error: "" };
}

export async function createBiomarker(formData: FormData) {
  await requireAuth();

  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const refLow = formData.get("refLow") ? String(formData.get("refLow")) : null;
  const refHigh = formData.get("refHigh") ? String(formData.get("refHigh")) : null;

  if (!name) throw new Error("Name is required");

  await getDb().insert(biomarkers).values({ name, unit, category, refLow, refHigh });
  revalidatePath("/");
}

export async function updateBiomarker(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const refLow = formData.get("refLow") ? String(formData.get("refLow")) : null;
  const refHigh = formData.get("refHigh") ? String(formData.get("refHigh")) : null;

  if (!id || !name) throw new Error("Name is required");

  await getDb()
    .update(biomarkers)
    .set({ name, unit, category, refLow, refHigh })
    .where(eq(biomarkers.id, id));
  revalidatePath("/");
  revalidatePath(`/biomarkers/${id}`);
}

export async function deleteBiomarker(id: string) {
  await requireAuth();

  await getDb().delete(biomarkers).where(eq(biomarkers.id, id));
  revalidatePath("/");
}

export async function addReading(formData: FormData) {
  await requireAuth();

  const biomarkerId = String(formData.get("biomarkerId") ?? "");
  const value = String(formData.get("value") ?? "");
  const takenAt = String(formData.get("takenAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!biomarkerId || !value || !takenAt) throw new Error("Missing required fields");

  await getDb().insert(readings).values({ biomarkerId, value, takenAt, notes });
  revalidatePath("/");
  revalidatePath(`/biomarkers/${biomarkerId}`);
}

export async function updateReading(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  const biomarkerId = String(formData.get("biomarkerId") ?? "");
  const value = String(formData.get("value") ?? "");
  const takenAt = String(formData.get("takenAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!id || !biomarkerId || !value || !takenAt) throw new Error("Missing required fields");

  await getDb().update(readings).set({ value, takenAt, notes }).where(eq(readings.id, id));
  revalidatePath("/");
  revalidatePath(`/biomarkers/${biomarkerId}`);
}

export async function deleteReading(id: string, biomarkerId: string) {
  await requireAuth();

  await getDb().delete(readings).where(and(eq(readings.id, id)));
  revalidatePath("/");
  revalidatePath(`/biomarkers/${biomarkerId}`);
}
