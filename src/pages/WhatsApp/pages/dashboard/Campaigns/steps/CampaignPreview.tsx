import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Calendar, Clock, Users, MessageSquare, CheckCircle } from 'lucide-react';
import { WhatsAppTemplatePreviewCard } from '@/components/ui/whatsapp-template-preview-card';
import { useMediaAssets } from '@/hooks/useMediaAssets';
import { useProjectContext } from '@/context/ProjectContext';
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

  // Fetch media assets to get the selected media asset
  const { data: mediaAssetsData } = useMediaAssets({
    projectId: selectedProject?._id || '',
    page: 1,
    limit: 50,
  });

  // Find the selected media asset when headerMediaAssetId is available
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
    if (date && scheduledTime) {
      const selectedDateTime = new Date(`${date}T${scheduledTime}`);
      const nowPlusOneMinute = new Date(Date.now() + 60 * 1000);

      if (selectedDateTime <= nowPlusOneMinute) {
        setScheduledError('Please choose a time at least 1 minute from now.');
        setValue('scheduledAt', undefined);
      } else {
        setScheduledError(null);
        const scheduledAt = selectedDateTime.toISOString();
        setValue('scheduledAt', scheduledAt);
      }
    } else {
      setScheduledError(null);
      setValue('scheduledAt', undefined);
    }
  };

  const handleTimeChange = (time: string) => {
    setScheduledTime(time);
    if (scheduledDate && time) {
      const selectedDateTime = new Date(`${scheduledDate}T${time}`);
      const nowPlusOneMinute = new Date(Date.now() + 60 * 1000);

      if (selectedDateTime <= nowPlusOneMinute) {
        setScheduledError('Please choose a time at least 1 minute from now.');
        setValue('scheduledAt', undefined);
      } else {
        setScheduledError(null);
        const scheduledAt = selectedDateTime.toISOString();
        setValue('scheduledAt', scheduledAt);
      }
    } else {
      setScheduledError(null);
      setValue('scheduledAt', undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Summary */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <Label className="text-lg font-semibold">Campaign Summary</Label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Campaign Name</span>
              </div>
              <p className="text-sm text-muted-foreground">{campaignData.name}</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Total Recipients</span>
              </div>
              <p className="text-sm text-muted-foreground">{contactType === 'whatsapp' ? selectedContacts.length : wlhAttendeeFilters.contactCount} contacts</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Message Template</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedTemplate?.name}</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status</span>
              </div>
              <Badge variant="outline" className="text-xs">Ready to Send</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Message Preview</Label>
        <WhatsAppTemplatePreviewCard
          template={selectedTemplate}
          variableMappings={variableMappings}
          sampleContact={sampleContact}
          showSampleContact={true}
          showVariableMappings={true}
          headerMediaAsset={selectedMediaAsset}
        />
      </div>

      {/* Sending Options */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Sending Options</Label>

        <RadioGroup value={sendType} onValueChange={handleSendTypeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="now" id="now" />
            <Label htmlFor="now" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Now
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scheduled" id="scheduled" />
            <Label htmlFor="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule for Later
            </Label>
          </div>
        </RadioGroup>

        {/* Schedule Options */}
        {sendType === 'scheduled' && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Date</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled-time">Time</Label>
              <Input
                id="scheduled-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => handleTimeChange(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Your local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>

            {scheduledError && (
              <p className="text-sm text-red-500">
                {scheduledError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Selected Contacts Preview */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Selected Contacts ({contactType === 'whatsapp' ? selectedContacts.length : wlhAttendeeFilters.contactCount})</Label>


      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {sendType === 'now' ? 'Sending Campaign...' : 'Scheduling Campaign...'}
            </>
          ) : (
            <>
              {sendType === 'now' ? (
                <>
                  <Send className="h-4 w-4" />
                  Launch Campaign
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Schedule Campaign
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CampaignPreview;
