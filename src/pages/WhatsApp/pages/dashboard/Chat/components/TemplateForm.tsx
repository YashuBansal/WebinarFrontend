import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Send, Image } from 'lucide-react';
import { MediaFileDialog } from '@/components/ui/MediaFileDialog';
import type { SendTemplateMessagePayload } from '@/schemas/templateSchema';

interface TemplateFormProps {
  templates: any[];
  mediaAssetsData: any;
  mediaAssetsLoading: boolean;
  mediaAssetsError: any;
  onTemplateSubmit: (payload: SendTemplateMessagePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function TemplateForm({
  templates,
  mediaAssetsData,
  mediaAssetsLoading,
  mediaAssetsError,
  onTemplateSubmit,
  onCancel,
  isSubmitting
}: TemplateFormProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [bodyVariables, setBodyVariables] = useState<string[]>([]);
  const [headerMediaAssetId, setHeaderMediaAssetId] = useState<string | null>(null);
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);

  // Extract variables from template body
  const extractVariablesFromText = (text: string): string[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    const bodyComponent = template.components.find((c: any) => c.type === 'BODY');
    if (bodyComponent?.text) {
      const variables = extractVariablesFromText(bodyComponent.text);
      setBodyVariables(new Array(variables.length).fill(''));
    } else {
      setBodyVariables([]);
    }
  };

  // Check if selected template has media header
  const hasMediaHeader = () => {
    if (!selectedTemplate) return false;
    const headerComponent = selectedTemplate.components.find((c: any) => c.type === 'HEADER');
    return headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format);
  };

  const getHeaderFormat = () => {
    if (!selectedTemplate) return null;
    const headerComponent = selectedTemplate.components.find((c: any) => c.type === 'HEADER');
    return headerComponent?.format || null;
  };

  // Filter media assets by template header format
  const getFilteredMediaAssets = () => {
    if (!mediaAssetsData?.data || !hasMediaHeader()) return [];
    
    const headerFormat = getHeaderFormat();
    if (!headerFormat) return [];

    return mediaAssetsData.data.filter((asset: any) => {
      switch (headerFormat) {
        case 'IMAGE':
          return asset.mimeType.startsWith('image/');
        case 'VIDEO':
          return asset.mimeType.startsWith('video/');
        case 'DOCUMENT':
          return asset.mimeType.startsWith('application/');
        default:
          return true;
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) return;

    const payload: SendTemplateMessagePayload = {
      projectId: '', // This will be provided by parent
      recipientPhoneNumber: '', // This will be provided by parent
      templateName: selectedTemplate.name,
      language: selectedTemplate.language || 'en_US',
      bodyVariables: bodyVariables.filter(v => v.trim() !== ''),
      headerMediaAssetId: headerMediaAssetId || selectedMediaAsset?._id || undefined,
    };

    await onTemplateSubmit(payload);
    
    // Reset form
    setSelectedTemplate(null);
    setBodyVariables([]);
    setHeaderMediaAssetId(null);
    setSelectedMediaAsset(null);
  };

  return (
    <div className="p-4 border-b bg-gray-50">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Send Template Message</CardTitle>
          <CardDescription>
            Select a template and fill in the variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedTemplate ? (
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{selectedTemplate.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {selectedTemplate.category} • {selectedTemplate.language}
                      </span>
                    </div>
                  ) : (
                    "Select a template"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search templates..." />
                  <CommandList className="max-h-[200px] overflow-auto">
                    <CommandEmpty>No templates found.</CommandEmpty>
                    <CommandGroup>
                      {templates.map((template) => (
                        <CommandItem
                          key={template.id}
                          value={template.name}
                          onSelect={() => handleTemplateSelect(template)}
                          className="cursor-pointer py-2"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedTemplate?.name === template.name ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {template.category} • {template.language}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Body Variables */}
          {bodyVariables.length > 0 && (
            <div className="space-y-2">
              <Label>Template Variables</Label>
              <div className="space-y-2">
                {bodyVariables.map((_, index) => (
                  <div key={index} className="space-y-1">
                    <Label htmlFor={`variable-${index}`} className="text-sm">
                      Variable {index + 1}:
                    </Label>
                    <Input
                      id={`variable-${index}`}
                      placeholder={`Enter value for variable ${index + 1}`}
                      value={bodyVariables[index] || ''}
                      onChange={(e) => {
                        const newVariables = [...bodyVariables];
                        newVariables[index] = e.target.value;
                        setBodyVariables(newVariables);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Header */}
          {hasMediaHeader() && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Media File ({getHeaderFormat()?.toLowerCase()})
              </Label>
              <MediaFileDialog
                mediaFiles={getFilteredMediaAssets()}
                isLoading={mediaAssetsLoading}
                error={mediaAssetsError}
                selectedFile={selectedMediaAsset}
                onFileSelect={setSelectedMediaAsset}
                onUploadNew={() => {}}
                fileType={getHeaderFormat()}
                title={`Select ${getHeaderFormat()?.toLowerCase()} File`}
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Image className="h-4 w-4 mr-2" />
                  {selectedMediaAsset ? selectedMediaAsset.fileName : `Choose ${getHeaderFormat()?.toLowerCase()} file...`}
                </Button>
              </MediaFileDialog>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedTemplate || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Template
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
