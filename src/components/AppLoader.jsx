import { Loader2 } from "lucide-react";

const SIZE_CLASSES = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
  "2xl": "h-12 w-12",
};

const VARIANT_CLASSES = {
  /** Matches new dashboard accent */
  brand: "text-green-500",
  /** Solid primary / green / blue buttons with light text */
  inverse: "text-white",
  /** Neutral surfaces */
  muted: "text-slate-400",
  /** Error / outlined danger actions */
  error: "text-red-600",
};

/**
 * Same visual language as the new admin dashboard loaders (lucide Loader2 + spin).
 */
export default function AppLoader({
  size = "sm",
  variant = "brand",
  className = "",
  ...rest
}) {
  const sz = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm;
  const v = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.brand;
  return (
    <Loader2
      className={`${sz} animate-spin ${v} ${className}`.trim()}
      aria-hidden
      {...rest}
    />
  );
}

/** Centered block with optional caption (dashboard-style). */
export function AppLoaderCenter({
  message = "Loading...",
  size = "lg",
  variant = "brand",
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 ${className}`.trim()}
      role="status"
    >
      <AppLoader size={size} variant={variant} className="mb-4" />
      {message ? (
        <p className="font-medium text-gray-500">{message}</p>
      ) : null}
    </div>
  );
}
