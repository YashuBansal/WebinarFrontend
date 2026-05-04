import React from 'react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
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

/**
 * Resolves variables in template body text
 */
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
      // Use contact field value
      const contactField = mapping.contactField.replace('$', ''); // Remove $ prefix
      value = sampleContact ? (sampleContact as any)[contactField] || placeholder : placeholder;
    } else {
      // Use static value
      value = mapping.staticValue || placeholder;
    }

    // Escape special regex characters in placeholder
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
      <Card className={className} style={style}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No template selected</p>
        </CardContent>
      </Card>
    );
  }

  // Extract template components
  const headerComponent = template.components?.find((c) => c.type === 'HEADER');
  const bodyComponent = template.components?.find((c) => c.type === 'BODY');
  const footerComponent = template.components?.find((c) => c.type === 'FOOTER');
  const buttonComponents = template.components?.filter((c) => c.type === 'BUTTONS');

  // Resolve body text with variables
  const resolvedBodyText = bodyComponent?.text
    ? resolveTemplateBody(bodyComponent.text, variableMappings, sampleContact)
    : '';

  // Get header format
  const headerFormat = headerComponent ? (headerComponent as any).format : null;
  const headerText = headerComponent && headerFormat === 'TEXT' ? headerComponent.text : null;

  return (
    <Card className={className} style={style}>
      <CardContent className="p-4 space-y-4">
        {/* Sample Contact */}
        {showSampleContact && sampleContact && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Sample Contact:</div>
            <div className="text-sm">
              <strong>
                {sampleContact.firstName || ''} {sampleContact.lastName || ''}
              </strong>
              <br />
              {sampleContact.email && sampleContact.phone
                ? `${sampleContact.email} • ${sampleContact.phone}`
                : sampleContact.email || sampleContact.phone || 'No contact info'}
            </div>
          </div>
        )}

        {/* WhatsApp Message Preview */}
        <div className="flex justify-center">
          <div className="max-w-[85%] md:max-w-[75%]">
            {/* WhatsApp message bubble */}
            <div className="bg-[#DCF8C6] dark:bg-[#056162] rounded-2xl shadow-sm overflow-hidden">
              {/* Header Image */}
              {headerFormat === 'IMAGE' && (
                <div className="w-full">
                  {headerMediaAsset?.filePath ? (
                    <img
                      src={headerMediaAsset.filePath}
                      alt={headerMediaAsset.fileName || 'Header image'}
                      className="w-full h-auto object-cover max-h-96"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200  px-4 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400 ">Image placeholder</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Header Video */}
              {headerFormat === 'VIDEO' && (
                <div className="w-full">
                  {headerMediaAsset?.filePath ? (
                    <video
                      src={headerMediaAsset.filePath}
                      controls
                      className="w-full h-auto object-cover max-h-96"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-64 px-4 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Video placeholder</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Header Document */}
              {headerFormat === 'DOCUMENT' && (
                <div className="w-full bg-gray-100 dark:bg-gray-800 p-4">
                  {headerMediaAsset?.filePath ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {headerMediaAsset.fileName || 'Document'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {headerMediaAsset.fileSize ? `${(headerMediaAsset.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Document file'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Document placeholder</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Select a document file</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Header Text */}
              {headerText && (
                <div className={`px-4 ${headerFormat === 'IMAGE' || headerFormat === 'VIDEO' || headerFormat === 'DOCUMENT' ? 'pt-3 pb-1' : 'pt-3 pb-1'}`}>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {headerText}
                  </div>
                </div>
              )}

              {/* Body */}
              {resolvedBodyText && (
                <div className={`px-4 ${headerText || headerFormat === 'IMAGE' || headerFormat === 'VIDEO' || headerFormat === 'DOCUMENT' ? 'py-2' : 'pt-3 pb-2'}`}>
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {resolvedBodyText}
                  </div>
                </div>
              )}

              {/* Footer */}
              {footerComponent?.text && (
                <div className={`px-4 ${resolvedBodyText || headerText || headerFormat === 'IMAGE' || headerFormat === 'VIDEO' || headerFormat === 'DOCUMENT' ? 'pb-3' : 'pt-2 pb-3'}`}>
                  <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                    {footerComponent.text}
                  </div>
                </div>
              )}

              {/* Buttons */}
              {buttonComponents && buttonComponents.length > 0 && (
                <div className="px-2 pb-3 pt-2 space-y-2">
                  {buttonComponents.map((button: any, index: number) => (
                    <div key={index} className="space-y-2">
                      {button.buttons?.map((btn: any, btnIndex: number) => (
                        <div
                          key={btnIndex}
                          className="bg-white dark:bg-gray-800 text-[#075E54] dark:text-[#DCF8C6] px-4 py-2.5 rounded-lg text-sm font-medium text-center border-0 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          style={{
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        >
                          {btn.type === 'QUICK_REPLY' ? btn.text : btn.text || 'N/A'}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variable Mappings */}
        {showVariableMappings && variableMappings.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Variable Mappings</h3>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="space-y-2 text-sm">
                {variableMappings.map((mapping, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {mapping.variable}
                    </Badge>
                    <span className="text-blue-700 dark:text-blue-300">
                      {mapping.isDynamic ? (
                        <>
                          Dynamic → {CONTACT_FIELD_LABELS[mapping.contactField] || mapping.contactField.replace('$', '')}
                          {mapping.fallbackValue && (
                            <span className="text-gray-500 dark:text-gray-400">
                              {' '}(fallback: &quot;{mapping.fallbackValue}&quot;)
                            </span>
                          )}
                        </>
                      ) : (
                        <>Static → &quot;{mapping.staticValue || 'empty'}&quot;</>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showVariableMappings && variableMappings.length === 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-muted-foreground">No variable mappings defined</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WhatsAppTemplatePreviewCard;

