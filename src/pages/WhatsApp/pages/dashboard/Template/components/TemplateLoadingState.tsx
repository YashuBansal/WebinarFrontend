import { RefreshCw } from 'lucide-react';

interface TemplateLoadingStateProps {
  message?: string;
}

export function TemplateLoadingState({ message = "Loading templates..." }: TemplateLoadingStateProps) {
  return (
    <div className="text-center py-12">
      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
      <p className="text-gray-600 dark:text-slate-400">{message}</p>
    </div>
  );
}
