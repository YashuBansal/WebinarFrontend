import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectContext } from "@/context/ProjectContext";
import { useProject, useProjectMutations } from "@/hooks/useProjects";
import { useWABADetails } from "@/hooks/useWABADetails";
import type { UpdateProjectPayload } from "@/schemas/projectSchema";
import { updateProjectPayloadSchema } from "@/schemas/projectSchema";
import { PhoneNumberSelector } from "@/components/ui/phone-number-selector";
import { isProjectConfigured } from "@/lib/projectUtils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle, Database, ShieldCheck, Key, Globe, Search, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface ManualConfigurationProps {
  onConfigurationSuccess?: () => void;
}

export default function ManualConfiguration({ onConfigurationSuccess }: ManualConfigurationProps) {
  const { selectedProject } = useProjectContext();
  const { data: project, isLoading, error } = useProject(selectedProject?._id);
  const { useUpdateProject } = useProjectMutations();
  const { mutate: updateProject, isPending: isUpdatingProject, error: updateError, isSuccess: isUpdateSuccess } = useUpdateProject();
  const { mutate: fetchWABADetails, data: wabaDetails, isPending: isLoadingWABA, error: wabaError } = useWABADetails();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const form = useForm<UpdateProjectPayload>({
    resolver: zodResolver(updateProjectPayloadSchema),
    defaultValues: {
      appId: "",
      appSecret: "",
      wabaId: "",
      permanentAccessToken: "",
      phoneNumberId: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        appId: project.appId || "",
        appSecret: project.appSecret || "",
        wabaId: project.wabaId || "",
        permanentAccessToken: project.permanentAccessToken || "",
        phoneNumberId: project.phoneNumberId || "",
        phone: project.phone || "",
      });
    }
  }, [project, form]);

  useEffect(() => {
    if (isUpdateSuccess) {
      setShowSuccessMessage(true);
      if (project && isProjectConfigured(project)) {
        if (onConfigurationSuccess) {
          onConfigurationSuccess();
        }
      }
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isUpdateSuccess, project, onConfigurationSuccess]);

  const handleFetchWABADetails = () => {
    const { appId, appSecret, wabaId, permanentAccessToken } = form.getValues();
    if (appId && appSecret && wabaId && permanentAccessToken) {
      fetchWABADetails({
        wabaId,
        accessToken: permanentAccessToken,
      });
    }
  };

  const onSubmit = (data: UpdateProjectPayload) => {
    if (!selectedProject?._id) return;
    
    let phoneValue = data.phone;
    if (data.phoneNumberId && wabaDetails) {
      const selectedPhone = wabaDetails.phone_numbers.data.find(phone => phone.id === data.phoneNumberId);
      if (selectedPhone) {
        phoneValue = selectedPhone.display_phone_number;
      }
    }
    
    const payloadWithPhone = {
      ...data,
      phone: phoneValue,
    };
    
    updateProject({
      projectId: selectedProject._id,
      payload: payloadWithPhone,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Fetching Project State...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-bold">Error</AlertTitle>
        <AlertDescription className="font-medium">
          {error?.message || "Failed to load project configuration"}
        </AlertDescription>
      </Alert>
    );
  }

  const { appId, appSecret, wabaId, permanentAccessToken } = form.watch();
  const canFetchWabaDetails = appId && appSecret && wabaId && permanentAccessToken;

  return (
    <div className="space-y-10">
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert className="bg-green-50 border-green-200 rounded-2xl mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 font-bold">Success</AlertTitle>
              <AlertDescription className="text-green-700 font-medium">
                Project configuration has been updated successfully.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {updateError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert variant="destructive" className="rounded-2xl mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Error</AlertTitle>
              <AlertDescription className="font-medium">
                {updateError.message || "Failed to update project configuration"}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="grid gap-8 md:grid-cols-2">
            {/* API Credentials Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">API Credentials</h4>
              </div>

              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="appId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">App ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your Meta App ID" className="rounded-xl border-slate-200 focus:ring-green-500/20 h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">App Secret</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Your Meta App Secret" className="rounded-xl border-slate-200 focus:ring-green-500/20 h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Account Identifiers Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Database className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Account Details</h4>
              </div>

              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="wabaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">WABA ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="WhatsApp Business Account ID" className="rounded-xl border-slate-200 focus:ring-green-500/20 h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanentAccessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Permanent Access Token</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="System User Token" className="rounded-xl border-slate-200 focus:ring-green-500/20 h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center py-4">
              <Button 
                type="button" 
                onClick={handleFetchWABADetails} 
                disabled={!canFetchWabaDetails || isLoadingWABA}
                className="h-12 px-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg transition-all"
              >
                  {isLoadingWABA ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                  Fetch WABA Details
              </Button>
          </div>

          <AnimatePresence>
            {wabaDetails && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 border border-slate-100 rounded-3xl p-8 bg-slate-50/50"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-green-600 border border-slate-100">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{wabaDetails.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Verified</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumberId"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-sm font-black text-slate-700 uppercase tracking-widest">Select Project Phone Number</FormLabel>
                      <PhoneNumberSelector
                        phoneNumbers={wabaDetails.phone_numbers.data}
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {wabaError && (
            <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Fetch Failed</AlertTitle>
                <AlertDescription className="font-medium">
                    {wabaError.message || "Failed to fetch WABA details. Please check your credentials."}
                </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <Button
              type="submit"
              disabled={isUpdatingProject}
              className="h-12 px-8 rounded-2xl flex items-center justify-center gap-2 text-white shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{
                backgroundColor: "#22B573",
                fontWeight: 700,
              }}
            >
              {isUpdatingProject ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-5 w-5" />
              )}
              Save Configuration
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}