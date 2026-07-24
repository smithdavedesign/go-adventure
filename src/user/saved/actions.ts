"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/user/auth/auth";
import { isSaved, saveDestination, unsaveDestination } from "./queries";

/** Toggle a destination save for the signed-in user (or send them to sign-in). */
export async function toggleSaveAction(formData: FormData) {
  const session = await auth();
  const destinationId = String(formData.get("destinationId"));
  const slug = String(formData.get("slug") ?? "");

  if (!session?.user?.id) {
    redirect(`/signin?next=${encodeURIComponent(`/destinations/${slug}`)}`);
  }

  const userId = session.user.id;
  if (await isSaved(userId, destinationId)) {
    await unsaveDestination(userId, destinationId);
  } else {
    await saveDestination(userId, destinationId);
  }

  revalidatePath(`/destinations/${slug}`);
  revalidatePath("/saved");
}
