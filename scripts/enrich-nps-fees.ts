/**
 * Backfill confirmed NPS entrance-fee facts onto the 28 already-published
 * destinations. Attaches a `FactAssertion` (confidence = confirmed, sourced) per
 * destination — it does NOT re-publish or touch the draft flow. Idempotent
 * (replaces the entranceFee fact each run). Requires NPS_API_KEY.
 *
 *   npm run enrich:fees
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";
import { NpsAdapter } from "@/platform/ingestion/nps/adapter";

const CODES =
  "yose,grca,zion,romo,glac,yell,grte,olym,mora,seki,acad,grsm,arch,brca,jotr,shen,noca,crla,badl,bibe,blca,cany,care,grsa,sagu,redw,pinn,lavo".split(
    ",",
  );

async function main() {
  const adapter = new NpsAdapter(process.env.NPS_API_KEY, CODES);
  const raws = await adapter.fetchRaw();
  const now = new Date();
  let wrote = 0;

  for (const raw of raws) {
    const draft = adapter.normalize(raw);
    const fee = draft.facts.find((f) => f.field === "entranceFee");
    if (!fee) continue;

    const dest = await prisma.destination.findUnique({
      where: { slug: draft.slug },
      select: { id: true },
    });
    if (!dest) continue;

    // Provenance: link to the latest NPS source record for this park.
    const sr = await prisma.sourceRecord.findFirst({
      where: { externalId: draft.sourceExternalId },
      orderBy: { retrievedAt: "desc" },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.factAssertion.deleteMany({
        where: {
          subjectType: "destination",
          subjectId: dest.id,
          field: "entranceFee",
        },
      }),
      prisma.factAssertion.create({
        data: {
          subjectType: "destination",
          subjectId: dest.id,
          field: "entranceFee",
          value: fee.value as object,
          confidence: "confirmed",
          sourceRecordId: sr?.id ?? null,
          verifiedAt: now,
        },
      }),
    ]);
    wrote++;
  }

  console.log(`Wrote entranceFee facts for ${wrote} destinations.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
