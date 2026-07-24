/**
 * Auth.js (v5) configuration — the single source of session identity (PRD:
 * do not mix Supabase Auth and Auth.js for the same user).
 *
 * Strategy: DATABASE sessions via the Prisma adapter (ADR-0002). Chosen so
 * sessions are revocable and account deletion cleanly invalidates them. Google
 * is the only launch provider; sign-in needs AUTH_GOOGLE_ID/SECRET (see
 * DEPENDENCIES) but the app boots fine without them — only the Google flow is
 * gated on the credentials.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/shared/config/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    // Surface the DB user's id and admin flag on the session (database strategy
    // passes the full user row).
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return session;
    },
  },
});
