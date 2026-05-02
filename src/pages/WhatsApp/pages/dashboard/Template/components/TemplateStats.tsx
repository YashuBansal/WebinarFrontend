import { Card, CardContent } from '@/components/ui/card';

interface TemplateStatsProps {
  totalTemplates: number;
  approvedTemplates: number;
  pendingTemplates: number;
  rejectedTemplates: number;
}

export function TemplateStats({ 
  totalTemplates, 
  approvedTemplates, 
  pendingTemplates, 
  rejectedTemplates 
}: TemplateStatsProps) {
  if (totalTemplates === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <Card>
        <CardContent className="p-3 lg:p-4 text-center">
          <div className="text-xl lg:text-2xl font-bold text-gray-900">{totalTemplates}</div>
          <div className="text-xs lg:text-sm text-gray-600">Total Templates</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 lg:p-4 text-center">
          <div className="text-xl lg:text-2xl font-bold text-green-600">{approvedTemplates}</div>
          <div className="text-xs lg:text-sm text-gray-600">Approved</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 lg:p-4 text-center">
          <div className="text-xl lg:text-2xl font-bold text-yellow-600">{pendingTemplates}</div>
          <div className="text-xs lg:text-sm text-gray-600">Pending</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 lg:p-4 text-center">
          <div className="text-xl lg:text-2xl font-bold text-red-600">{rejectedTemplates}</div>
          <div className="text-xs lg:text-sm text-gray-600">Rejected</div>
        </CardContent>
      </Card>
    </div>
  );
}
