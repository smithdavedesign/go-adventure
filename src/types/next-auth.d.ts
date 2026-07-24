import type { DefaultSession } from "next-auth";

// Augment the session user with our added fields (see auth.ts session callback).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}
