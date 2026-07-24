"use server";

import { auth, signOut } from "@/user/auth/auth";
import { deleteUserAccount } from "@/user/profiles/account";

/** Permanently delete the signed-in user's account, then sign out. */
export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  await deleteUserAccount(session.user.id);
  // Session rows were cascade-deleted; clear the cookie and go home.
  await signOut({ redirectTo: "/" });
}
