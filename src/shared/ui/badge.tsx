import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "brand" | "outline";

const VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-secondary text-secondary-foreground",
  brand: "bg-brand text-brand-foreground",
  outline: "border border-border text-muted-foreground",
};

/** Small inline label chip. Presentational only. */
export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
