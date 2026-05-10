import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  RefreshCw, 
  Phone, 
  Building, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useWabaDetails } from '@/hooks/useTemplates';

export default function WabaDetails() {
  const { data: wabaResponse, isLoading, error, refetch } = useWabaDetails();
  const [showTokens, setShowTokens] = useState(false);
  
  const wabaData = wabaResponse?.data;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log(`${label} copied to clipboard`);
  };

  const maskToken = (token: string) => {
    if (!token) return 'Not configured';
    if (showTokens) return token;
    return token.substring(0, 8) + '...' + token.substring(token.length - 4);
  };

  const getStatusIcon = (isConfigured: boolean) => {
    return isConfigured ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (isConfigured: boolean) => {
    return isConfigured 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900/60 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-slate-400">Loading WhatsApp Business Account details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900/60 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to Load WABA Details</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                {(error.response?.data as any)?.message || 'An error occurred while fetching WhatsApp Business Account details.'}
              </p>
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!wabaData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900/60 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No WhatsApp Business Account</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">No WhatsApp Business Account is configured for this project.</p>
          </div>
        </div>
      </div>
    );
  }

  const isWabaConfigured = !!(wabaData.wabaId && wabaData.permanentAccessToken);
  const isPhoneConfigured = !!wabaData.phoneNumberId;
  const isAppConfigured = !!(wabaData.appId && wabaData.appSecret);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900/60 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp Business Account</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">
              Manage your WhatsApp Business Account configuration
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Project Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Project Name</label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{wabaData.projectName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Project ID</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-600 dark:text-slate-400">{wabaData._id}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(wabaData._id, 'Project ID')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Created</label>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {new Date(wabaData.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Last Updated</label>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {new Date(wabaData.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Business Account Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              WhatsApp Business Account Status
            </CardTitle>
            <CardDescription>
              Overview of your WhatsApp Business Account configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/60 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isWabaConfigured)}
                  <div>
                    <p className="font-medium">WhatsApp Business Account</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {isWabaConfigured ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isWabaConfigured)}`}>
                  {isWabaConfigured ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/60 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isPhoneConfigured)}
                  <div>
                    <p className="font-medium">Phone Number</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {isPhoneConfigured ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isPhoneConfigured)}`}>
                  {isPhoneConfigured ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/60 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isAppConfigured)}
                  <div>
                    <p className="font-medium">App Configuration</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {isAppConfigured ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isAppConfigured)}`}>
                  {isAppConfigured ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WhatsApp Business Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business Account</CardTitle>
              <CardDescription>
                Your WhatsApp Business Account configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">WABA ID</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
                    {wabaData.wabaId || 'Not configured'}
                  </p>
                  {wabaData.wabaId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wabaData.wabaId!, 'WABA ID')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Phone Number ID</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
                    {wabaData.phoneNumberId || 'Not configured'}
                  </p>
                  {wabaData.phoneNumberId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wabaData.phoneNumberId!, 'Phone Number ID')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Phone Number</label>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {wabaData.phone || 'Not configured'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* App Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>App Configuration</CardTitle>
              <CardDescription>
                Meta App configuration details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">App ID</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
                    {wabaData.appId || 'Not configured'}
                  </p>
                  {wabaData.appId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wabaData.appId!, 'App ID')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">App Secret</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
                    {maskToken(wabaData.appSecret || '')}
                  </p>
                  {wabaData.appSecret && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(wabaData.appSecret!, 'App Secret')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTokens(!showTokens)}
                      >
                        {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Access Token</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
                    {maskToken(wabaData.permanentAccessToken || '')}
                  </p>
                  {wabaData.permanentAccessToken && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(wabaData.permanentAccessToken!, 'Access Token')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTokens(!showTokens)}
                      >
                        {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        {!isWabaConfigured && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Setup Required
              </CardTitle>
              <CardDescription>
                Your WhatsApp Business Account is not fully configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-slate-400">
                  To use WhatsApp Business features, you need to complete the setup process:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-slate-400">
                  <li>Create a Meta App in the Meta for Developers console</li>
                  <li>Add WhatsApp Business API to your app</li>
                  <li>Configure your WhatsApp Business Account</li>
                  <li>Get your App ID, App Secret, and Access Token</li>
                  <li>Add your phone number and get the Phone Number ID</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can use the exchange code feature to automatically 
                    set up your WhatsApp Business Account if you have the authorization code from Meta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
