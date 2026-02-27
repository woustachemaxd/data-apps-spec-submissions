import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingState({
  label,
  variant = "dashboard",
}: {
  label: string;
  variant?: "dashboard" | "panel";
}) {
  if (variant === "panel") {
    return (
      <Card className="w-full border-[var(--border-color)] bg-[var(--card-bg)] py-0 ring-0">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-56 w-full rounded-2xl" />
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-[var(--border-color)] bg-[var(--card-bg)] py-0 ring-0">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="border-[var(--border-color)] bg-[var(--glass-bg)] py-0 ring-0">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-[var(--border-color)] bg-[var(--glass-bg)] py-0 ring-0">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-9 w-56 rounded-xl" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, row) => (
                  <div key={row} className="grid grid-cols-4 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        </CardContent>
      </Card>
    </div>
  );
}
