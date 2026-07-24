"use server";

import { signIn, signOut } from "@/user/auth/auth";

export async function signInWithGoogle(formData: FormData) {
  const next = String(formData.get("next") ?? "/");
  await signIn("google", { redirectTo: next });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
