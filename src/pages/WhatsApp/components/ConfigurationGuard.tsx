import { type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectContext } from '@/context/ProjectContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Settings, ArrowLeft } from 'lucide-react';
import { isProjectConfigured } from '@/lib/projectUtils';

interface ConfigurationGuardProps {
  children: ReactNode;
  fallbackToConfiguration?: boolean;
}

/**
 * ConfigurationGuard component that ensures users can only access features
 * after configuring their WhatsApp Business Account
 */
export const ConfigurationGuard = ({ 
  children, 
  fallbackToConfiguration = true 
}: ConfigurationGuardProps) => {
  const { selectedProject } = useProjectContext();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const isConfigured = isProjectConfigured(selectedProject);

  // If project is configured, render children normally
  if (isConfigured) {
    return <>{children}</>;
  }

  // If fallback is disabled, show access denied
  if (!fallbackToConfiguration) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-600 dark:text-red-400">Access Restricted</CardTitle>
            </div>
            <CardDescription>
              This feature requires WhatsApp Business Account configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Please configure your WhatsApp Business Account first to access this feature.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate(`/whatsapp/dashboard/${projectId}/configuration`)}
                  className="flex-1"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/whatsapp')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to configuration page
  navigate(`/whatsapp/dashboard/${projectId}/configuration`, { replace: true });
  return null;
};

export default ConfigurationGuard;
