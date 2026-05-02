import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface TemplateErrorStateProps {
  error: any;
  onRetry: () => void;
}

export function TemplateErrorState({ error, onRetry }: TemplateErrorStateProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Templates</h3>
        <p className="text-gray-600 mb-4">
          {(error.response?.data as any)?.message || 'An error occurred while fetching templates.'}
        </p>
        <Button onClick={onRetry}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}
