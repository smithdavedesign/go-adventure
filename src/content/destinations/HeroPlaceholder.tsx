import { slugGradient } from "@/shared/utils/color";
import { cn } from "@/lib/utils";

/**
 * Destination hero. Renders a real (Wikimedia, licensed) image when `imageUrl`
 * is present, with a required photo credit; otherwise falls back to a
 * deterministic gradient from the slug. Graceful either way.
 */
export function HeroPlaceholder({
  slug,
  alt,
  imageUrl,
  credit,
  className,
  children,
}: {
  slug: string;
  alt: string | null;
  imageUrl?: string | null;
  credit?: string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label={alt ?? "Destination image"}
      style={
        imageUrl
          ? { backgroundImage: `url("${imageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
          : { backgroundImage: slugGradient(slug) }
      }
      className={cn("relative overflow-hidden bg-secondary", className)}
    >
      {children}
      {imageUrl && credit && (
        <span className="absolute bottom-1 right-2 text-[10px] text-white/70">
          📷 {credit}
        </span>
      )}
    </div>
  );
}
