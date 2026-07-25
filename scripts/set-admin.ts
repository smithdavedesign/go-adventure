/**
 * Grant (or revoke) the admin role on a user by email. Admin access is now an
 * authenticated Google account with `isAdmin = true` (replaces the interim
 * password gate). The account must have signed in at least once so the row
 * exists. Idempotent.
 *
 *   npm run set-admin -- you@example.com          # grant
 *   npm run set-admin -- you@example.com --revoke # revoke
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"));
  const revoke = args.includes("--revoke");
  if (!email) {
    console.error("Usage: npm run set-admin -- <email> [--revoke]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No user with email ${email}. They must sign in with Google once first ` +
        `(so the account row exists), then re-run this.`,
    );
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { isAdmin: !revoke },
  });
  console.log(`${revoke ? "Revoked admin from" : "Granted admin to"} ${email}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
