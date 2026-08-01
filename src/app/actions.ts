"use server";

import { getDb } from "@/db";
import { biomarkers, readings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createBiomarker(formData: FormData) {
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
  await getDb().delete(biomarkers).where(eq(biomarkers.id, id));
  revalidatePath("/");
}

export async function addReading(formData: FormData) {
  const biomarkerId = String(formData.get("biomarkerId") ?? "");
  const value = String(formData.get("value") ?? "");
  const takenAt = String(formData.get("takenAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!biomarkerId || !value || !takenAt) throw new Error("Missing required fields");

  await getDb().insert(readings).values({ biomarkerId, value, takenAt, notes });
  revalidatePath("/");
  revalidatePath(`/biomarkers/${biomarkerId}`);
}

export async function deleteReading(id: string, biomarkerId: string) {
  await getDb().delete(readings).where(and(eq(readings.id, id)));
  revalidatePath("/");
  revalidatePath(`/biomarkers/${biomarkerId}`);
}
