import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  LayoutGrid, 
  Smartphone, 
  ExternalLink, 
  Terminal,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import EmbeddedSignup from '@/components/EmbeddedSignup';
import ManualConfiguration from './ManualConfiguration';
import { useProjectContext } from '@/context/ProjectContext';
import { isProjectConfigured } from '@/lib/projectUtils';

const Configuration = () => {
  const { selectedProject } = useProjectContext();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'embedded' | 'manual'>('embedded');
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const isConfigured = isProjectConfigured(selectedProject);

  // Redirect if already configured
  useEffect(() => {
    if (isConfigured) {
      navigate(`/whatsapp/dashboard/${projectId}/profile`, { replace: true });
    }
  }, [isConfigured, navigate, projectId]);

  const handleConnectionSuccess = () => {
    setError(null);
    setShowSuccessMessage(true);
    console.log('WhatsApp connection successful');
    
    // Hard refresh after successful configuration to update sidebar and state
    setTimeout(() => {
      sessionStorage.setItem('postConfigRedirect', `/whatsapp/dashboard/${projectId}/profile`);
      window.location.reload();
    }, 2000);
  };

  const handleConnectionFailure = (errorMessage: string) => {
    setError(errorMessage);
    setShowSuccessMessage(false);
  };

  if (isConfigured) {
    return (
      <div className="min-h-full w-full flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[32px] p-10 border border-slate-200 shadow-2xl text-center"
        >
          <div className="h-20 w-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">Configuration Complete!</h1>
          <p className="text-slate-500 font-medium mb-8">
            Your WhatsApp Business Account is ready to go. We're getting your workspace ready.
          </p>
          <div className="flex items-center gap-3 justify-center text-green-600 font-bold text-sm">
            <div className="h-2 w-2 rounded-full bg-green-600 animate-ping" />
            Updating interface...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 lg:p-4 xl:p-6 2xl:p-8">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest">
              <Settings className="h-3 w-3" />
              Project Settings
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              WhatsApp Configuration
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              Project: <span className="text-slate-900 font-bold">{selectedProject?.projectName || 'No Project Selected'}</span>
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {showSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Alert className="bg-green-50 border-green-200 rounded-2xl">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 font-bold">Success</AlertTitle>
                <AlertDescription className="text-green-700 font-medium">
                  WhatsApp Business Account configured successfully! Refreshing to update interface...
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Configuration Error</AlertTitle>
                <AlertDescription className="font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Embedded Signup Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div 
              className={`group relative flex flex-col bg-white border h-full transition-all duration-300 rounded-[24px] p-6 sm:p-8 cursor-pointer ${
                activeTab === 'embedded' 
                  ? 'border-green-400 shadow-xl shadow-green-900/5 ring-1 ring-green-400/20' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
              }`}
              onClick={() => setActiveTab('embedded')}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                  activeTab === 'embedded' ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                }`}>
                  <Smartphone className="h-7 w-7" />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  activeTab === 'embedded' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  Recommended
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-2">Embedded Signup</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Fastest way to connect. Use Meta's secure popup flow to automatically link your account and fetch credentials.
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50">
                <EmbeddedSignup
                  onConnectionSuccess={handleConnectionSuccess}
                  onConnectionFailure={handleConnectionFailure}
                  projectId={selectedProject?._id}
                  isActive={activeTab === 'embedded'}
                />
              </div>
            </div>
          </motion.div>

          {/* Manual Configuration Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div 
              className={`group relative flex flex-col bg-white border h-full transition-all duration-300 rounded-[24px] p-6 sm:p-8 cursor-pointer ${
                activeTab === 'manual' 
                  ? 'border-blue-400 shadow-xl shadow-blue-900/5 ring-1 ring-blue-400/20' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
              }`}
              onClick={() => setActiveTab('manual')}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                  activeTab === 'manual' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                }`}>
                  <Terminal className="h-7 w-7" />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  activeTab === 'manual' ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  Developer
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-2">Manual Setup</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  For advanced users. Manually enter your App ID, App Secret, WABA ID, and Permanent Access Tokens from Meta.
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50">
                <Button
                  onClick={() => setActiveTab('manual')}
                  className={`w-full h-12 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    activeTab === 'manual' 
                      ? 'text-white shadow-xl shadow-slate-900/20' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  style={activeTab === 'manual' ? { backgroundColor: "#0f172a", fontWeight: 700 } : { fontWeight: 700 }}
                >
                  Configure Manually
                  <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${activeTab === 'manual' ? 'translate-x-1' : ''}`} />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Configuration Panel */}
        <AnimatePresence>
          {activeTab === 'manual' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="mt-8"
            >
              <div className="bg-white border border-slate-200 rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-slate-200/40">
                <div className="mb-8 flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Manual Configuration</h2>
                    <p className="text-slate-500 text-sm font-medium">Please enter your Meta Business details below</p>
                  </div>
                </div>
                <ManualConfiguration onConfigurationSuccess={handleConnectionSuccess} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Configuration;
