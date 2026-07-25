import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 has no built-in query engine binary for SQL databases — the driver
// adapter (`pg`) is the connection itself. Singleton avoids exhausting the
// connection pool across Next.js dev-server hot reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Serverless scales horizontally, so total connections = (instances × poolMax).
// Supabase's SESSION-mode pooler caps at ~15 clients, so even a small per-instance
// pool exhausts it under modest concurrency (EMAXCONNSESSION). Default to 1 in
// production — the standard serverless/PgBouncer setting (`connection_limit=1`):
// it maximizes the number of concurrent instances before the cap and is ideal
// once DATABASE_URL points at the TRANSACTION-mode pooler (port 6543), which is
// the real fix (it multiplexes many clients onto few connections). Override with
// PRISMA_POOL_MAX if you keep session-mode and know your instance ceiling.
const poolMax = parsePositiveInt(
  process.env.PRISMA_POOL_MAX,
  process.env.NODE_ENV === "production" ? 1 : 10,
);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  max: poolMax,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
