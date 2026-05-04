import React from 'react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import {
  ChevronLeft,
  Video,
  Phone as PhoneIcon,
  MoreVertical,
  Camera,
  Mic,
  Plus,
  Smile,
  Signal,
  Wifi,
  BatteryFull,
  SendHorizontal,
  Info
} from 'lucide-react';
import type { CampaignTemplate, VariableMapping, CampaignContact } from '@/schemas/campaignSchema';

interface MediaAsset {
  _id: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType: string;
  createdAt?: string;
}

interface WhatsAppTemplatePreviewCardProps {
  template: CampaignTemplate | null;
  variableMappings: VariableMapping[];
  sampleContact?: CampaignContact;
  showSampleContact?: boolean;
  showVariableMappings?: boolean;
  headerMediaAsset?: MediaAsset | null;
  className?: string;
  style?: React.CSSProperties;
}

const CONTACT_FIELD_LABELS: Record<string, string> = {
  '$firstName': 'First Name',
  '$lastName': 'Last Name',
  '$email': 'Email',
  '$phone': 'Phone',
  '$gender': 'Gender',
  '$location': 'Location',
  '$source': 'Source',
  '$registeredCount': 'Registered Webinar Count',
  '$attendedCount': 'Attended Webinar Count',
};

const resolveTemplateBody = (
  templateBody: string,
  mappings: VariableMapping[],
  sampleContact?: CampaignContact
): string => {
  if (!mappings || mappings.length === 0) {
    return templateBody || '';
  }

  let message = templateBody || '';
  mappings.forEach((mapping) => {
    const placeholder = mapping.variable;
    let value = '';

    if (mapping.isDynamic) {
      const contactField = mapping.contactField.replace('$', '');
      value = sampleContact ? (sampleContact as any)[contactField] || placeholder : placeholder;
    } else {
      value = mapping.staticValue || placeholder;
    }

    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    message = message.replace(new RegExp(escapedPlaceholder, 'g'), value);
  });

  return message;
};

export function WhatsAppTemplatePreviewCard({
  template,
  variableMappings,
  sampleContact,
  showSampleContact = false,
  showVariableMappings = true,
  headerMediaAsset,
  className = '',
  style,
}: WhatsAppTemplatePreviewCardProps) {
  if (!template) {
    return (
      <Card className={`${className} overflow-hidden border-none shadow-xl bg-white/50 backdrop-blur-md`} style={style}>
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-500">No template selected</p>
          <p className="text-sm text-gray-400 mt-1">Select a template to see how it looks on a real phone</p>
        </CardContent>
      </Card>
    );
  }

  const headerComponent = template.components?.find((c) => c.type === 'HEADER');
  const bodyComponent = template.components?.find((c) => c.type === 'BODY');
  const footerComponent = template.components?.find((c) => c.type === 'FOOTER');
  const buttonComponents = template.components?.filter((c) => c.type === 'BUTTONS');

  const resolvedBodyText = bodyComponent?.text
    ? resolveTemplateBody(bodyComponent.text, variableMappings, sampleContact)
    : '';

  const headerFormat = headerComponent ? (headerComponent as any).format : null;
  const headerText = headerComponent && headerFormat === 'TEXT' ? headerComponent.text : null;

  return (
    <div className={`flex flex-col gap-6 ${className}`} style={style}>
      {/* iPhone 16 Mockup */}
      <div className="relative mx-auto w-[270px] h-[550px] bg-[#1a1a1a] rounded-[45px] p-[10px] shadow-[0_0_0_2px_#333,0_15px_40px_rgba(0,0,0,0.25)] ring-1 ring-white/10 overflow-hidden">
        {/* Dynamic Island */}
        <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[80px] h-[24px] bg-black rounded-[20px] z-50 flex items-center justify-center">
          <div className="w-[35px] h-[3px] bg-white/10 rounded-full"></div>
        </div>

        {/* Inner Content Container (Screen) */}
        <div className="relative w-full h-full bg-[#f8fafc] rounded-[36px] overflow-hidden flex flex-col">
          {/* Status Bar */}
          <div className="h-[38px] px-6 flex items-center justify-between z-40 bg-white">
            <div className="text-[12px] font-bold text-black">1:11</div>
            <div className="flex items-center gap-1.5 text-black">
              <Wifi size={14} strokeWidth={3} />
              <div className="relative w-5 h-2.5 border-[1.5px] border-black rounded-[3px] flex items-center p-[1px]">
                <div className="w-full h-full bg-black rounded-[2px]"></div>
                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[3px] bg-black rounded-r-[1px]"></div>
              </div>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="bg-white border-b border-gray-200/80 px-2 py-2 flex items-center gap-1.5 z-40 shadow-sm">
            <div className="flex items-center text-slate-900 hover:opacity-70 transition-opacity">
              <ChevronLeft size={20} />
            </div>
            <div className="flex-1 flex items-center gap-2 ml-0.5">
              <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sampleContact?.firstName || 'Business'}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-black leading-tight truncate">
                  {sampleContact?.firstName ? `${sampleContact.firstName} ${sampleContact.lastName || ''}` : 'Profile'}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">online</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-900">
              <Video size={18} />
              <PhoneIcon size={16} />
            </div>
          </div>

          {/* Chat Background with Image (Synced with ChatWindow) */}
          <div className="flex-1 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none bg-repeat bg-[url('/whatsapp-bg.png')] z-0"
              style={{ backgroundSize: '400px' }}
            ></div>

            <div className="absolute inset-0 overflow-y-auto z-10 custom-scrollbar">
              <div className="px-3 pt-2 pb-4">
                {/* Date Tag */}
                <div className="flex justify-center mb-3">
                  <div className="bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-500 px-3 py-1 rounded-lg shadow-sm border border-gray-100 uppercase tracking-wider">
                    TODAY
                  </div>
                </div>

                {/* Message Bubble - Synced with MessagesList Inbound Style */}
                <div className="flex justify-start mb-4 max-w-[85%] relative group">
                  {/* Message Notch (Tail) */}
                  <div className="absolute top-0 -left-[6px] w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]"></div>

                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm overflow-hidden relative z-20">
                    {/* Header Asset */}
                    {headerFormat === 'IMAGE' && (
                      <div className="w-full border-b border-gray-50">
                        {headerMediaAsset?.filePath ? (
                          <img
                            src={headerMediaAsset.filePath}
                            alt="Header content"
                            className="w-full h-auto object-cover max-h-60"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gray-50 flex items-center justify-center">
                            <div className="text-center p-4">
                              <Camera className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-[11px] text-gray-400">Image placeholder</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {headerFormat === 'VIDEO' && (
                      <div className="w-full border-b border-gray-100">
                        {headerMediaAsset?.filePath ? (
                          <video
                            src={headerMediaAsset.filePath}
                            className="w-full h-auto object-cover max-h-60"
                            poster="https://via.placeholder.com/320x180?text=Video+Preview"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gray-50 flex items-center justify-center">
                            <div className="text-center p-4">
                              <Video className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-[11px] text-gray-400">Video placeholder</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Body Content */}
                    <div className="p-2.5">
                      {headerText && (
                        <div className="text-[12px] font-bold text-gray-900 mb-1 leading-tight">
                          {headerText}
                        </div>
                      )}
                      {resolvedBodyText && (
                        <div className="text-[12px] text-gray-800 whitespace-pre-wrap leading-normal">
                          {resolvedBodyText}
                        </div>
                      )}
                      {footerComponent?.text && (
                        <div className="text-[11px] text-gray-500 mt-1 font-medium italic">
                          {footerComponent.text}
                        </div>
                      )}

                      {/* Message Meta (Time) */}
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-gray-400 font-medium">1:11 PM</span>
                      </div>
                    </div>

                    {/* Buttons (Inside Bubble but styled as list) */}
                    {buttonComponents && buttonComponents.length > 0 && (
                      <div className="border-t border-gray-100 bg-white/50">
                        {buttonComponents.map((buttonComp: any, idx: number) => (
                          <div key={idx}>
                            {buttonComp.buttons?.map((btn: any, btnIdx: number) => (
                              <div
                                key={btnIdx}
                                className="flex items-center justify-center py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <span className="text-[#007AFF] text-[12px] font-medium truncate px-4">
                                  {btn.text || 'Action Button'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Footer (Input Bar) */}
          <div className="flex-shrink-0 bg-[#F6F6F6] border-t border-gray-200 px-3 pt-1.5 pb-8 z-40">
            <div className="flex items-center gap-2">
              <Plus className="text-slate-900 flex-shrink-0" size={20} />
              <div className="flex-1 h-8 bg-white border border-gray-300 rounded-full px-3 flex items-center justify-between">
                <span className="text-transparent">|</span>
                <Smile className="text-gray-400" size={18} />
              </div>
              <div className="flex items-center gap-2 text-slate-900">
                <Camera size={20} />
                <Mic size={20} />
              </div>
            </div>
          </div>

          {/* iOS Home Indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-[4px] bg-black/20 rounded-full z-50"></div>
        </div>
      </div>

    </div>
  );
}

export default WhatsAppTemplatePreviewCard;


