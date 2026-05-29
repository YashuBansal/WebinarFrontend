import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  Calendar, 
  Clock, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Layout, 
  Zap,
  ChevronRight,
  AlertCircle,
  FileText
} from 'lucide-react';
import { WhatsAppTemplatePreviewCard } from '@/components/ui/whatsapp-template-preview-card';
import { useMediaAssets } from '@/hooks/useMediaAssets';
import { useProjectContext } from '@/context/ProjectContext';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  CampaignTemplate,
  VariableMapping,
  CampaignContact,
  WlhAttendeeFilterState,
} from '@/schemas/campaignSchema';

interface CampaignPreviewProps {
  campaignData: any;
  selectedContacts: CampaignContact[];
  selectedTemplate: CampaignTemplate | null;
  variableMappings: VariableMapping[];
  selectedSessionTemplate?: CampaignTemplate | null;
  sessionVariableMappings?: VariableMapping[];
  onSubmit: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
  setValue: (name: any, value: any) => void;
  watchedValues: any;
  wlhAttendeeFilters: WlhAttendeeFilterState;
  contactType: string;
  headerMediaAssetId: string | null;
}

const CampaignPreview = ({
  campaignData,
  selectedContacts,
  selectedTemplate,
  variableMappings,
  selectedSessionTemplate = null,
  sessionVariableMappings = [],
  onSubmit,
  onPrevious,
  isSubmitting,
  setValue,
  watchedValues,
  wlhAttendeeFilters,
  contactType,
  headerMediaAssetId,
}: CampaignPreviewProps) => {
  const { selectedProject } = useProjectContext();
  const [sendType, setSendType] = useState<'now' | 'scheduled'>(watchedValues.sendType || 'now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledError, setScheduledError] = useState<string | null>(null);
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);

  const sampleContact = selectedContacts[0];

  const { data: mediaAssetsData } = useMediaAssets({
    projectId: selectedProject?._id || '',
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    if (headerMediaAssetId && mediaAssetsData?.data) {
      const mediaAsset = mediaAssetsData.data.find((file: any) => file._id === headerMediaAssetId);
      if (mediaAsset) {
        setSelectedMediaAsset(mediaAsset);
      }
    } else {
      setSelectedMediaAsset(null);
    }
  }, [headerMediaAssetId, mediaAssetsData]);

  const canSubmit =
    sendType === 'now' ||
    (sendType === 'scheduled' && scheduledDate && scheduledTime && !scheduledError);

  const handleSendTypeChange = (value: 'now' | 'scheduled') => {
    setSendType(value);
    setScheduledError(null);
    setValue('sendType', value);

    if (value === 'scheduled' && scheduledDate && scheduledTime) {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      setValue('scheduledAt', scheduledAt);
    } else if (value === 'now') {
      setValue('scheduledAt', undefined);
    }
  };

  const handleDateChange = (date: string) => {
    setScheduledDate(date);
    updateScheduledDateTime(date, scheduledTime);
  };

  const handleTimeChange = (time: string) => {
    setScheduledTime(time);
    updateScheduledDateTime(scheduledDate, time);
  };

  const updateScheduledDateTime = (date: string, time: string) => {
    if (date && time) {
      const selectedDateTime = new Date(`${date}T${time}`);
      const nowPlusOneMinute = new Date(Date.now() + 60 * 1000);

      if (selectedDateTime <= nowPlusOneMinute) {
        setScheduledError('Please choose a time at least 1 minute from now.');
        setValue('scheduledAt', undefined);
      } else {
        setScheduledError(null);
        setValue('scheduledAt', selectedDateTime.toISOString());
      }
    } else {
      setScheduledError(null);
      setValue('scheduledAt', undefined);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 py-2"
    >
      {/* Campaign Summary Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#22B573]/10 flex items-center justify-center">
            <Layout className="h-5 w-5 text-[#22B573]" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Campaign Manifest</h3>
            <p className="text-xs font-medium text-slate-400">Review your configuration before deployment</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-md transition-all group">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <FileText className="h-4 w-4 text-blue-500" />
                <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none text-[9px] font-black px-1.5 py-0">NAME</Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{campaignData.name}</p>
                <p className="text-[10px] font-medium text-slate-400">Target Identifier</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-md transition-all group">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Users className="h-4 w-4 text-[#22B573]" />
                <Badge variant="secondary" className="bg-[#22B573]/10 text-[#22B573] border-none text-[9px] font-black px-1.5 py-0">AUDIENCE</Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {contactType === 'whatsapp' ? selectedContacts.length : wlhAttendeeFilters.contactCount} Contacts
                </p>
                <p className="text-[10px] font-medium text-slate-400">Total Recipients</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-md transition-all group">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-none text-[9px] font-black px-1.5 py-0">TEMPLATE</Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{selectedTemplate?.name}</p>
                <p className="text-[10px] font-medium text-slate-400">WhatsApp Approved</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-md transition-all group">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-4 w-4 text-orange-500" />
                <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none text-[9px] font-black px-1.5 py-0">STATUS</Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Validated</p>
                <p className="text-[10px] font-medium text-slate-400">System Ready</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left Column: Preview */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Transmission Preview</h3>
              <p className="text-xs font-medium text-slate-400">Simulated mobile experience</p>
            </div>
          </div>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {selectedSessionTemplate && (
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/50 p-6 flex flex-col items-center">
                <Badge className="mb-4 bg-green-500 hover:bg-green-600 text-white font-extrabold uppercase text-[10px] tracking-wide px-3 py-1 rounded-full">
                  ⚡ Session Delivery
                </Badge>
                <div className="w-full">
                  <WhatsAppTemplatePreviewCard
                    template={selectedSessionTemplate}
                    variableMappings={sessionVariableMappings}
                    sampleContact={sampleContact}
                    showSampleContact={true}
                    showVariableMappings={true}
                  />
                </div>
              </div>
            )}

            {selectedTemplate && (
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/50 p-6 flex flex-col items-center">
                <Badge className="mb-4 bg-blue-500 hover:bg-blue-600 text-white font-extrabold uppercase text-[10px] tracking-wide px-3 py-1 rounded-full">
                  🌐 Standard Fallback
                </Badge>
                <div className="w-full">
                  <WhatsAppTemplatePreviewCard
                    template={selectedTemplate}
                    variableMappings={variableMappings}
                    sampleContact={sampleContact}
                    showSampleContact={true}
                    showVariableMappings={true}
                    headerMediaAsset={selectedMediaAsset}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Transmission Settings */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Send className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Launch Control</h3>
              <p className="text-xs font-medium text-slate-400">Configure deployment timeline</p>
            </div>
          </div>

          <div className="space-y-6">
            <RadioGroup 
              value={sendType} 
              onValueChange={handleSendTypeChange}
              className="grid gap-4"
            >
              <Label
                htmlFor="now"
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  sendType === 'now' 
                  ? 'border-[#22B573] bg-[#22B573]/5 shadow-sm' 
                  : 'border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <RadioGroupItem value="now" id="now" className="sr-only" />
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${sendType === 'now' ? 'bg-[#22B573] text-white' : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400'}`}>
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Instant Broadcast</p>
                  <p className="text-xs font-medium text-slate-400">Deliver all messages immediately</p>
                </div>
                {sendType === 'now' && <CheckCircle2 className="h-5 w-5 text-[#22B573]" />}
              </Label>

              <Label
                htmlFor="scheduled"
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  sendType === 'scheduled' 
                  ? 'border-[#22B573] bg-[#22B573]/5 shadow-sm' 
                  : 'border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <RadioGroupItem value="scheduled" id="scheduled" className="sr-only" />
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${sendType === 'scheduled' ? 'bg-[#22B573] text-white' : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400'}`}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Scheduled Release</p>
                  <p className="text-xs font-medium text-slate-400">Plan for a specific future moment</p>
                </div>
                {sendType === 'scheduled' && <CheckCircle2 className="h-5 w-5 text-[#22B573]" />}
              </Label>
            </RadioGroup>

            <AnimatePresence>
              {sendType === 'scheduled' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled-date" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Launch Date</Label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#22B573] transition-colors" />
                        <Input
                          id="scheduled-date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-12 pl-12 rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-[#22B573]/10 focus:border-[#22B573] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduled-time" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Launch Time</Label>
                      <div className="relative group">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#22B573] transition-colors" />
                        <Input
                          id="scheduled-time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => handleTimeChange(e.target.value)}
                          className="h-12 pl-12 rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-[#22B573]/10 focus:border-[#22B573] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Current Node: <span className="text-slate-900 dark:text-white font-bold">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                    </p>
                  </div>

                  {scheduledError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p className="text-xs font-bold">{scheduledError}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <motion.div variants={itemVariants} className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-700/50">
        <Button 
          variant="ghost" 
          onClick={onPrevious} 
          className="h-12 px-6 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Step
        </Button>

        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`h-14 px-10 rounded-2xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 flex items-center gap-2 ${
            sendType === 'now' 
            ? 'bg-[#22B573] hover:bg-[#1a8d58] text-white shadow-[#22B573]/20' 
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {sendType === 'now' ? 'Transmitting...' : 'Scheduling...'}
            </>
          ) : (
            <>
              {sendType === 'now' ? (
                <>
                  <Zap className="h-5 w-5" />
                  Launch Campaign
                </>
              ) : (
                <>
                  <Calendar className="h-5 w-5" />
                  Schedule Broadcast
                </>
              )}
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CampaignPreview;
