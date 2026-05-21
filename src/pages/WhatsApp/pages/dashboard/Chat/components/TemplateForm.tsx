import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Send, Image, X, Info, MessageSquare } from 'lucide-react';
import { MediaFileDialog } from '@/components/ui/MediaFileDialog';
import { WhatsAppTemplatePreviewCard } from '@/components/ui/whatsapp-template-preview-card';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Detect variables in body text (handles {{1}}, {{2}}, etc.)
  const detectedVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    const bodyComponent = selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'BODY');
    const body = bodyComponent?.text || '';
    const matches = body.match(/\{\{\d+\}\}/g) || [];
    // Extract unique indices: {{1}}, {{2}} -> [1, 2]
    const indices = Array.from(new Set(matches.map((m: string) => parseInt(m.replace(/\{\{|\}\}/g, ''))))) as number[];
    return indices.sort((a, b) => a - b);
  }, [selectedTemplate]);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setIsDropdownOpen(false);

    // Reset inputs
    setBodyVariables([]);
    setHeaderMediaAssetId(null);
    setSelectedMediaAsset(null);
  };

  const handleVariableChange = (index: number, value: string) => {
    const newVars = [...bodyVariables];
    newVars[index - 1] = value; // Meta variables are 1-indexed
    setBodyVariables(newVars);
  };

  const getProcessedContent = () => {
    if (!selectedTemplate) return '';
    const bodyComponent = selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'BODY');
    let content = bodyComponent?.text || '';
    detectedVariables.forEach(index => {
      const val = bodyVariables[index - 1] || `{{${index}}}`;
      content = content.replace(new RegExp(`\\{\\{${index}\\}\\}`, 'g'), val);
    });
    return content;
  };

  const hasMediaHeader = () => {
    if (!selectedTemplate) return false;
    const headerComponent = selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'HEADER');
    return headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format?.toUpperCase());
  };

  const getHeaderFormat = () => {
    if (!selectedTemplate) return null;
    const headerComponent = selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'HEADER');
    return headerComponent?.format?.toUpperCase() || null;
  };

  const getFilteredMediaAssets = () => {
    if (!mediaAssetsData?.data || !hasMediaHeader()) return [];
    const format = getHeaderFormat();
    return mediaAssetsData.data.filter((asset: any) => {
      if (format === 'IMAGE') return asset.mimeType?.startsWith('image/');
      if (format === 'VIDEO') return asset.mimeType?.startsWith('video/');
      if (format === 'DOCUMENT') return asset.mimeType?.startsWith('application/');
      return true;
    });
  };

  const isFormValid = useMemo(() => {
    if (!selectedTemplate) return false;
    // All variables must be non-empty
    const allVariablesFilled = bodyVariables.every(v => v.trim() !== '');
    // If media is required, it must be selected
    const mediaRequired = hasMediaHeader();
    const mediaSelected = !!selectedMediaAsset;

    return allVariablesFilled && (!mediaRequired || mediaSelected);
  }, [selectedTemplate, bodyVariables, selectedMediaAsset]);

  const handleSubmit = async () => {
    if (!selectedTemplate) return;
    const payload: SendTemplateMessagePayload = {
      projectId: '',
      recipientPhoneNumber: '',
      templateName: selectedTemplate.name,
      language: selectedTemplate.language || 'en_US',
      bodyVariables: bodyVariables.map(v => v.trim() || ' '),
      headerMediaAssetId: headerMediaAssetId || selectedMediaAsset?._id || undefined,
    };
    await onTemplateSubmit(payload);

    // Reset selection after submit
    setSelectedTemplate(null);
    setBodyVariables([]);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-200">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Send Template</h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium italic">Official WABA Template • Meta Approved</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Left Column: Selector + Inputs (60%) */}
            <div className="lg:col-span-3 space-y-8">
              {/* Template Selector */}
              <div className="space-y-3">
                <Label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Select WABA Template</Label>
                <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-14 px-5 border-gray-200 dark:border-slate-700/50 hover:border-teal-500/50 hover:bg-teal-50/10 transition-all rounded-2xl shadow-sm bg-white dark:bg-slate-900/50">
                      {selectedTemplate ? (
                        <div className="flex flex-col items-start text-left">
                          <span className="font-bold text-[15px] text-gray-800 dark:text-slate-200">{selectedTemplate.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">{selectedTemplate.category} • {selectedTemplate.language}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium">Choose a template from your library...</span>
                      )}
                      <ChevronsUpDown className="h-5 w-5 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-gray-100 dark:border-slate-700/50 rounded-2xl overflow-hidden z-[100]"
                    align="start"
                    side="bottom"
                    sideOffset={8}
                  >
                    <Command className="dark:bg-slate-900">
                      <CommandInput placeholder="Search templates..." className="h-12 border-none focus:ring-0 outline-none" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No templates found.</CommandEmpty>
                        <CommandGroup>
                          {templates.map((t) => (
                            <CommandItem
                              key={t.id || t.name}
                              onSelect={() => handleTemplateSelect(t)}
                              className="p-4 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-none"
                            >
                              <Check className={`mr-3 h-4 w-4 text-teal-600 ${selectedTemplate?.name === t.name ? 'opacity-100' : 'opacity-0'}`} />
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-700 dark:text-slate-200">{t.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{t.category} • {t.language}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedTemplate && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                  {/* Media Header Section */}
                  {hasMediaHeader() && (
                    <div className="space-y-3 bg-gray-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <Label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Image className="h-3.5 w-3.5 text-teal-500" />
                        Header {getHeaderFormat()}
                      </Label>
                      <MediaFileDialog
                        mediaFiles={getFilteredMediaAssets()}
                        isLoading={mediaAssetsLoading}
                        error={mediaAssetsError}
                        selectedFile={selectedMediaAsset}
                        onFileSelect={setSelectedMediaAsset}
                        onUploadNew={() => { }}
                        fileType={getHeaderFormat()}
                        title={`Select ${getHeaderFormat()} File`}
                      >
                        <Button variant="outline" className={`w-full justify-start h-14 rounded-xl border-dashed border-2 transition-all ${selectedMediaAsset ? 'border-teal-500 bg-teal-50/30 text-teal-700' : 'hover:border-teal-500/50 hover:bg-teal-50/5 text-gray-500 dark:text-slate-400'}`}>
                          <Image className={`h-5 w-5 mr-3 ${selectedMediaAsset ? 'text-teal-600' : 'text-teal-400'}`} />
                          <span className="font-semibold truncate">
                            {selectedMediaAsset ? selectedMediaAsset.fileName : `Pick a ${getHeaderFormat()?.toLowerCase()}...`}
                          </span>
                        </Button>
                      </MediaFileDialog>
                    </div>
                  )}

                  {/* Dynamic Variables Section */}
                  {detectedVariables.length > 0 ? (
                    <div className="space-y-4">
                      <Label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Info className="h-3.5 w-3.5 text-teal-500" />
                        Template Variables
                      </Label>
                      <div className="grid gap-5">
                        {detectedVariables.map((index) => (
                          <div key={index} className="space-y-2 group">
                            <Label htmlFor={`var-${index}`} className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 ml-1 group-focus-within:text-teal-600 transition-colors uppercase tracking-wider">
                              Variable {'{{'}{index}{'}}'}
                            </Label>
                            <Input
                              id={`var-${index}`}
                              placeholder={`Value for {{${index}}}`}
                              className="h-12 rounded-xl border-gray-200 dark:border-slate-700/50 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all bg-white dark:bg-slate-900/50"
                              value={bodyVariables[index - 1] || ''}
                              onChange={(e) => handleVariableChange(index, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 border border-gray-200 dark:border-slate-800 rounded-3xl bg-[#efeae2] dark:bg-slate-950/40 shadow-inner relative overflow-hidden">
                      <div className="h-12 w-12 rounded-full bg-teal-500/10 dark:bg-teal-900/20 flex items-center justify-center mb-3 z-10">
                        <Info className="h-6 w-6 text-teal-600/70" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest text-center italic z-10">Plain Text Message</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 text-center z-10">No placeholders to fill for this template.</p>
                      {/* Suble background pattern for consistency */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-repeat bg-[url('/whatsapp-bg.png')] z-0" style={{ backgroundSize: '200px' }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: High-Fidelity Preview (40%) */}
            <div className="lg:col-span-2">
              <div className="sticky top-0 space-y-4">
                <Label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Live Preview</Label>
                {selectedTemplate ? (
                  <div className="bg-[#efeae2] dark:bg-slate-950/40 rounded-[2.5rem] p-8 border border-gray-200 dark:border-slate-800 shadow-inner relative overflow-hidden flex items-center justify-center min-h-[500px]">
                    <div className="relative z-10 w-full animate-in zoom-in-95 duration-500">
                      <WhatsAppTemplatePreviewCard
                        template={{
                          ...selectedTemplate,
                          components: (selectedTemplate.components || []).map((c: any) => {
                            if (c.type?.toUpperCase() === 'BODY') return { ...c, text: getProcessedContent() };
                            if (c.type?.toUpperCase() === 'HEADER' && selectedMediaAsset) {
                              return { ...c, text: selectedMediaAsset.filePath, example: { header_handle: [selectedMediaAsset.filePath] } };
                            }
                            return c;
                          })
                        }}
                        variableMappings={bodyVariables.map((val, idx) => ({
                          variable: `{{${idx + 1}}}`,
                          mappedValue: val || `{{${idx + 1}}}`,
                          type: 'custom'
                        }))}
                        showSampleContact={true}
                        showVariableMappings={false}
                        className="w-full scale-105 origin-center border-none shadow-none bg-transparent"
                      />
                    </div>
                    {/* WhatsApp Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none bg-repeat bg-[url('/whatsapp-bg.png')] z-0" style={{ backgroundSize: '350px' }}></div>
                  </div>
                ) : (
                  <div className="h-[550px] border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-10 bg-gray-50/50 dark:bg-slate-900/40 relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="h-20 w-20 rounded-3xl bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 flex items-center justify-center mb-8 mx-auto shadow-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                        <MessageSquare className="h-10 w-10 text-gray-400 dark:text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-[0.2em] mb-4">No Template Selected</h3>
                      <p className="text-gray-500 dark:text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
                        Choose a template from the list to see how it will look on your customers' phones.
                      </p>
                    </div>

                    {/* Floating Say Hi! Bubble */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 p-2 pr-5 rounded-full shadow-xl animate-bounce-subtle">
                      <div className="h-10 w-10 rounded-full bg-teal-500 overflow-hidden border-2 border-teal-400/30">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-gray-800 dark:text-white font-bold text-sm tracking-wide">Say Hi!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700/50 flex gap-3 justify-end items-center">
        <Button variant="ghost" onClick={onCancel} className="rounded-xl font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest text-[10px] hover:bg-gray-200/50">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedTemplate || isSubmitting}
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-10 h-12 shadow-lg shadow-teal-500/20 transition-all active:scale-95 flex items-center font-bold"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
          {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
