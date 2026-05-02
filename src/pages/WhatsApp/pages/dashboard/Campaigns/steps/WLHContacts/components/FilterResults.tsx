import { Skeleton } from "@/components/ui/skeleton";

interface FilterResultsProps {
  isLoading: boolean;
  count?: number;
}

export function FilterResults({ isLoading, count }: FilterResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-2">
        <Skeleton className="h-5 w-5 rounded-full animate-spin" />
        <p>Fetching attendee count...</p>
      </div>
    );
  }

  if (count !== undefined && count !== null) {
    return (
      <div className="pt-2 animate-in fade-in-50">
        <h3 className="font-semibold text-lg">Results</h3>
        <p className="text-3xl font-bold text-primary">{count}</p>
        <p className="text-sm text-muted-foreground">
          matching attendees found.
        </p>
      </div>
    );
  }

  return null;
}

