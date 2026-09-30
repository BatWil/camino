import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[26px]", className)} aria-hidden />;
}

export function ScreenSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-5 pt-4" role="status" aria-label="Cargando">
      <Skeleton className="h-16 w-2/3 rounded-2xl" />
      <Skeleton className="h-52" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}
