import type { GalleryPhoto } from "@/shared/types/content";

/**
 * Openly-licensed photo gallery for a destination (PRD Launch Set: "Photos").
 * Each tile carries its required per-image attribution. Uses CSS background
 * images (CSP-friendly, same approach as the hero) rather than <img>.
 */
export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold">Photos</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p) => (
          <figure
            key={p.id}
            className="overflow-hidden rounded-xl border border-border"
          >
            <div
              role="img"
              aria-label={p.alt ?? "Destination photo"}
              className="h-36 w-full bg-secondary bg-cover bg-center sm:h-40"
              style={{ backgroundImage: `url(${JSON.stringify(p.imageUrl)})` }}
            />
            {p.credit && (
              <figcaption
                className="truncate px-2 py-1 text-[11px] text-muted-foreground"
                title={p.credit}
              >
                {p.credit}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Photos via Wikimedia Commons under their respective licences.
      </p>
    </section>
  );
}
