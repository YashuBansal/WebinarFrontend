import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectContext } from "@/context/ProjectContext";
import {
  useBusinessProfile,
  useDisplayNameStatus,
  useWebhookSubscriptionStatus,
  useProfileMutations,
} from "@/hooks/useProfile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Upload,
  Edit,
  User,
  Mail,
  MapPin,
  Globe,
  Building,
  RefreshCw,
  LayoutGrid,
  Settings,
  ChevronRight,
  ArrowRight,
  Camera,
  X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "./components/ProfileForm";
import { DisplayNameStatus } from "./components/DisplayNameStatus";
import { ProfilePictureUpload } from "./components/ProfilePictureUpload";
import { WebhookSubscriptionStatus } from "./components/WebhookSubscriptionStatus";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProfileManagement = () => {
  const { selectedProject } = useProjectContext();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useBusinessProfile(selectedProject?._id);
  const {
    data: displayNameStatus,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useDisplayNameStatus(selectedProject?._id);
  const {
    data: webhookSubscriptionStatus,
    isLoading: isLoadingWebhookStatus,
    error: webhookStatusError,
  } = useWebhookSubscriptionStatus(selectedProject?._id);
  const { useUpdateBusinessProfile, useUploadProfilePicture, useSubscribeWebhook, useSyncBusinessProfile } =
    useProfileMutations();

  const {
    mutate: updateProfile,
    isPending: isUpdatingProfile,
    error: updateError,
  } = useUpdateBusinessProfile();
  const {
    mutate: uploadProfilePicture,
    isPending: isUploadingPicture,
    error: uploadError,
  } = useUploadProfilePicture();
  const {
    mutate: subscribeWebhook,
    isPending: isSubscribing,
    error: subscribeError,
  } = useSubscribeWebhook();
  const {
    mutate: syncBusinessProfile,
    isPending: isSyncingProfile,
    error: syncError,
  } = useSyncBusinessProfile();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleProfileUpdate = (data: any) => {
    if (!selectedProject?._id) return;
    updateProfile(
      { projectId: selectedProject._id, payload: data },
      {
        onSuccess: () => {
          setIsEditingProfile(false);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        },
      }
    );
  };

  const handleProfilePictureUpload = (file: File) => {
    if (!selectedProject?._id) return;
    uploadProfilePicture(
      { projectId: selectedProject._id, file },
      {
        onSuccess: () => {
          setIsEditingPicture(false);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        },
      }
    );
  };

  const ProfileInfoDisplay = () => {
    if (!profile) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white dark:bg-slate-800/50 shadow-sm">
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-4">
            <User className="h-8 w-8 opacity-20" />
          </div>
          <p className="font-bold text-sm uppercase tracking-widest">No Profile Data</p>
        </div>
      );
    }

    const items = [
      { icon: Building, label: "Category", value: profile.vertical?.trim().split("_").join(" "), badge: true },
      { icon: Mail, label: "Business Email", value: profile.email },
      { icon: MapPin, label: "Business Address", value: profile.address },
      { icon: User, label: "About", value: profile.about },
      { icon: User, label: "Description", value: profile.description },
    ];

    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => item.value && (
            <div key={i} className="group p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
              </div>
              {item.badge ? (
                <Badge variant="secondary" className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white font-bold px-3 py-1 rounded-lg">
                  {item.value}
                </Badge>
              ) : (
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        {profile.websites && profile.websites.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Websites</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.websites.map((website, index) => (
                <a
                  key={index}
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  {website}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!selectedProject) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-800/50">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">No Project Selected</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Please select a project to manage its WhatsApp Business profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-1">
              <User className="h-3.5 w-3.5" />
              Business Profile
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Profile Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Manage your identity and configuration on <span className="text-slate-900 dark:text-white font-bold">WhatsApp Business</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => syncBusinessProfile({ projectId: selectedProject._id })}
              disabled={isSyncingProfile || isLoadingProfile}
              className="h-11 px-6 rounded-xl flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSyncingProfile ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync Profile
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Alert className="bg-green-50 dark:bg-green-500/10 border-green-200 rounded-2xl mb-6">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 font-bold">Updated Successfully</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400 font-medium">Your business profile has been synchronized with Meta.</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Row: Picture, Display Name, Webhook */}
        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {/* Profile Picture Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center text-center"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-green-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="relative inline-block mb-4">
                <div className="h-24 w-24 rounded-[28px] overflow-hidden bg-slate-50 dark:bg-slate-900/50 border-4 border-white shadow-xl relative group/img">
                  {isLoadingProfile ? (
                    <Skeleton className="h-full w-full" />
                  ) : profile?.profile_picture_url ? (
                    <img src={profile.profile_picture_url} alt="Profile" className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-200">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                  <button 
                    onClick={() => setIsEditingPicture(true)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 rounded-xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">{selectedProject?.projectName}</h3>
              <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px] mt-1">Verified Account</p>
              
              <Button 
                onClick={() => setIsEditingPicture(true)}
                variant="outline"
                className="mt-5 h-9 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 px-5"
              >
                Change Photo
              </Button>
            </div>
          </motion.div>

          {/* Display Name Status */}
          <div className="flex flex-col">
            {isLoadingStatus && !displayNameStatus ? (
              <Skeleton className="h-full w-full rounded-[20px]" />
            ) : (
              displayNameStatus && <DisplayNameStatus status={displayNameStatus} />
            )}
          </div>

          {/* Webhook Status */}
          <div className="flex flex-col">
            <WebhookSubscriptionStatus
              status={webhookSubscriptionStatus}
              isLoading={isLoadingWebhookStatus}
              error={webhookStatusError}
              projectId={selectedProject?._id}
              onSubscribe={() => subscribeWebhook({ projectId: selectedProject._id })}
              isSubscribing={isSubscribing}
            />
          </div>
        </div>

        {/* Bottom Row: Business Details (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 sm:p-8 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-green-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Business Information</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Configure your brand identity on WhatsApp</p>
              </div>
              {!isEditingProfile && (
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  className="h-10 px-6 rounded-xl flex items-center gap-2 text-white font-bold shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: "#22B573" }}
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditingProfile ? (
              <ProfileForm
                profile={profile}
                isEditing={isEditingProfile}
                onSubmit={handleProfileUpdate}
                onCancel={() => setIsEditingProfile(false)}
                isSubmitting={isUpdatingProfile}
              />
            ) : (
              <ProfileInfoDisplay />
            )}
          </div>
        </motion.div>
      </main>

      {/* Change Photo Dialog */}
      <Dialog open={isEditingPicture} onOpenChange={setIsEditingPicture}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-8 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-800/50" showCloseButton={true}>
          <DialogHeader className="mb-8">
            <DialogTitle className="text-[20px] font-bold text-[#071028] tracking-tight">Change Profile Photo</DialogTitle>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Update your business profile picture on WhatsApp.</p>
          </DialogHeader>
          
          <div className="mb-8">
            <ProfilePictureUpload
              currentImageUrl={profile?.profile_picture_url}
              onUpload={handleProfilePictureUpload}
              isUploading={isUploadingPicture}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditingPicture(false)}
              className="rounded-xl h-10 px-6 font-bold text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setIsEditingPicture(false)}
              className="rounded-xl h-10 px-6 font-bold bg-[#22B573] hover:bg-[#1da467] text-white shadow-lg shadow-green-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileManagement;
