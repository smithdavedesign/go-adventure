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

// Serverless runtimes can scale horizontally; each instance opening a large pg
// pool quickly exhausts Supabase's session-mode client cap.
const poolMax = parsePositiveInt(
  process.env.PRISMA_POOL_MAX,
  process.env.NODE_ENV === "production" ? 3 : 10,
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
