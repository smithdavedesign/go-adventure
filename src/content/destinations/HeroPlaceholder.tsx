import { slugGradient } from "@/shared/utils/color";
import { cn } from "@/lib/utils";

/**
 * Stand-in for a destination hero image until rights-cleared media exists
 * (M5/M6). Renders a deterministic gradient from the slug. `aria-label` carries
 * the accessible description; it's decorative-but-named rather than a real photo.
 */
export function HeroPlaceholder({
  slug,
  alt,
  className,
  children,
}: {
  slug: string;
  alt: string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label={alt ?? "Destination placeholder image"}
      style={{ backgroundImage: slugGradient(slug) }}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
    </div>
  );
}
