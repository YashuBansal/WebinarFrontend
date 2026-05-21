interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-800/50">
      <div className="text-center text-gray-500 dark:text-slate-400">
        <div className="text-lg font-medium mb-2">{title}</div>
        <div className="text-sm">{description}</div>
      </div>
    </div>
  );
}
