"use server";

import { signOut as authSignOut } from "@/lib/auth/config";

export async function signOutAction() {
  await authSignOut({ redirectTo: "/" });
}
