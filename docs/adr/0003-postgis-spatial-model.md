# ADR-0003: PostGIS and spatial model

**Status:** Accepted
**Forced by:** Roadmap M1 (minimal schema)

## Context

The PRD requires PostGIS for points, route geometry, regions, map bounds, and proximity queries, with "display coordinates stored separately only as a projection of canonical geography data." Prisma has no first-class PostGIS type support — the standard pattern is `Unsupported("geography(...)")` field types plus raw SQL (`$queryRaw`/`$executeRaw`) for geometry reads/writes and migrations.

## Decision

- `Destination.location` — `Unsupported("geography(Point,4326)")`, **nullable at the DB/Prisma level**. Prisma's typed `.create()`/`.update()` cannot populate an `Unsupported` column in the same call — rows are created via Prisma for their typed fields, then given their geometry via a parameterized raw-SQL `UPDATE` immediately after. A `NOT NULL` constraint would make that two-step sequence a transient violation, so "every published destination has a point" is enforced by the publish workflow (M6), not the schema. A draft row can legitimately exist before an editor pins the exact point.
- `Trail.routeGeometry` — `Unsupported("geography(MultiLineString,4326)")`, same nullable-at-DB/enforced-at-publish pattern, same reason.
- `Destination.area` — `Unsupported("geometry(MultiPolygon,4326)")`, nullable — both for the mechanical reason above and because not every destination needs a boundary polygon at all.
- **Reads/writes go through raw SQL**, always parameterized (`$queryRaw`/`$executeRaw` with tagged-template params, never string-interpolated) — `ST_MakePoint`/`ST_GeogFromText` to write, `ST_AsGeoJSON`/`ST_X`/`ST_Y` to read. Prisma's typed query builder cannot touch `Unsupported` columns at all.
- **No redundant lat/lng float columns.** Where display coordinates are needed (e.g., serializing to the map component), derive them from the canonical geography column at read time rather than storing a second copy that can drift.
- **Migrations:** the *initial* `CREATE TABLE` for an `Unsupported` column comes from `prisma migrate dev` directly — Prisma emits the raw type string as-is. Prisma cannot diff further changes to that column type, so any later `ALTER` on a spatial column is a hand-written SQL migration, not a schema-driven one.
- **Spatial indexes** (GiST) on `location` and `routeGeometry` are declared in the schema with `@@index([location], type: Gist)` **and** created by raw SQL in the initial migration. Both are needed: the raw SQL actually builds the index on a fresh DB, and the schema declaration keeps Prisma from treating the index as drift on every subsequent `migrate dev`. The hand-written `CREATE INDEX` names must match Prisma's derived names (`Destination_location_idx`, `Trail_routeGeometry_idx`) so the two agree.

## Consequences

- Every query touching geometry (seeding, the M2 map view, future proximity filters) goes through `prisma.$queryRaw`/`$executeRaw` — this is the one part of the codebase that isn't fully type-safe through Prisma's normal client, by design, not oversight.
- **Verified during M1:** Prisma 7 *does* accept `@@index([location], type: Gist)` on an `Unsupported` column (`prisma validate` passes, and `migrate diff` against the live DB is empty). Without the schema declaration, `migrate diff` wants to `DROP` the GiST indexes on every run — so the declaration is load-bearing, not cosmetic. (An earlier draft of this ADR assumed the schema syntax was unavailable; that was wrong.)
- Seed data (M1) includes real, if fabricated, geometry (not null placeholders) — this exercises the spatial read/write path immediately instead of deferring that risk to real ingestion at M5.
