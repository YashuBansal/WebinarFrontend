import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Send, Image, X, Info } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extract unique variables from template body (handles {{1}}, {{name}}, etc.)
  const extractVariables = (text: string): string[] => {
    if (!text) return [];
    const matches = text.match(/\{\{(.+?)\}\}/g);
    if (!matches) return [];

    // Extract labels inside {{}}
    const uniqueVars = Array.from(new Set(matches.map(m => m.replace(/[{}]/g, ''))));

    // Sort: numbers first, then strings
    return uniqueVars.sort((a, b) => {
      const na = parseInt(a);
      const nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setIsDropdownOpen(false);
    // Find body component (case-insensitive)
    const bodyComponent = template.components?.find((c: any) => c.type?.toUpperCase() === 'BODY');

    if (bodyComponent?.text) {
      const vars = extractVariables(bodyComponent.text);
      // Initialize variables array with empty strings
      setBodyVariables(new Array(vars.length).fill(''));
    } else {
      setBodyVariables([]);
    }

    // Reset media selection
    setHeaderMediaAssetId(null);
    setSelectedMediaAsset(null);
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

  // Preview text with variables injected
  const previewText = useMemo(() => {
    if (!selectedTemplate) return '';
    const bodyComponent = selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'BODY');
    if (!bodyComponent?.text) return '';

    let text = bodyComponent.text;
    const vars = extractVariables(text);

    vars.forEach((varName, idx) => {
      const placeholder = `{{${varName}}}`;
      const value = bodyVariables[idx];
      // Replace all occurrences of this variable
      text = text.split(placeholder).join(value || placeholder);
    });

    return text;
  }, [selectedTemplate, bodyVariables]);

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
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between bg-gray-50/50">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Send Template</h3>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Choose a template and fill required variables</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Template Selector */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">WABA Template</Label>
          <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-12 px-4 border-gray-200 dark:border-slate-700/50 hover:border-teal-500/50 hover:bg-teal-50/10 transition-all rounded-xl">
                {selectedTemplate ? (
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-gray-700 dark:text-slate-300">{selectedTemplate.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase">{selectedTemplate.language} • {selectedTemplate.category}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Select a template from your library...</span>
                )}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-gray-100 dark:border-slate-700/50 rounded-2xl overflow-hidden z-[100]" 
              align="start"
              side="top"
              sideOffset={8}
              avoidCollisions={true}
            >
              <Command>
                <CommandInput placeholder="Search templates..." className="h-12 border-none focus:ring-0 focus-visible:ring-0 outline-none" />
                <CommandList className="max-h-[200px] md:max-h-[300px]">
                  <CommandEmpty>No templates found.</CommandEmpty>
                  <CommandGroup>
                    {templates.map((t) => (
                      <CommandItem
                        key={t.id || t.name}
                        onSelect={() => handleTemplateSelect(t)}
                        className="p-3 cursor-pointer hover:bg-teal-50 transition-colors"
                      >
                        <Check className={`mr-2 h-4 w-4 text-teal-600 ${selectedTemplate?.name === t.name ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-700 dark:text-slate-300">{t.name}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Left Column: Inputs */}
            <div className="space-y-6">
              {/* Media Header Section */}
              {hasMediaHeader() && (
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Image className="h-3.5 w-3.5" />
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
                    <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-dashed border-2 hover:border-teal-500/50 hover:bg-teal-50/5 text-gray-500 dark:text-slate-400 transition-all">
                      <Image className="h-4 w-4 mr-2 text-teal-500" />
                      {selectedMediaAsset ? selectedMediaAsset.fileName : `Pick a ${getHeaderFormat()?.toLowerCase()}...`}
                    </Button>
                  </MediaFileDialog>
                </div>
              )}

              {/* Dynamic Variables Section */}
              <div className="space-y-4">
                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-teal-500" />
                  Template Variables
                </Label>

                {bodyVariables.length > 0 ? (
                  <div className="grid gap-4">
                    {bodyVariables.map((_, idx) => (
                      <div key={idx} className="space-y-1.5 group">
                        <Label htmlFor={`var-${idx}`} className="text-[10px] font-bold text-gray-500 dark:text-slate-400 ml-1 group-focus-within:text-teal-600 transition-colors">
                          Variable {'{{'}{extractVariables(selectedTemplate.components.find((c: any) => c.type?.toUpperCase() === 'BODY')?.text || '')[idx]}{'}}'}
                        </Label>
                        <Input
                          id={`var-${idx}`}
                          placeholder="Type value here..."
                          className="h-12 rounded-xl border-gray-200 dark:border-slate-700/50 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all"
                          value={bodyVariables[idx]}
                          onChange={(e) => {
                            const newVars = [...bodyVariables];
                            newVars[idx] = e.target.value;
                            setBodyVariables(newVars);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 dark:border-slate-700/50 rounded-2xl bg-gray-50/30 animate-in fade-in zoom-in-95 duration-300">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">No variables required</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 text-center">This template has no placeholders to fill.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Real-time Preview */}
            <div className="space-y-3">
              <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Message Preview</Label>
              <div className="bg-[#efeae2] rounded-2xl p-6 shadow-inner border border-gray-200 dark:border-slate-700/50 min-h-[160px] relative overflow-hidden flex items-start justify-start">
                {/* Mock Chat Bubble */}
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl rounded-tl-none p-4 shadow-md max-w-[90%] border border-gray-100 dark:border-slate-700/50 z-10 relative animate-in zoom-in-95 duration-300">
                  <p className="text-[14px] leading-relaxed text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{previewText}</p>
                </div>
                {/* WhatsApp Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-repeat bg-[url('/whatsapp-bg.png')] z-0" style={{ backgroundSize: '300px' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700/50 flex gap-3 justify-end items-center">
        <Button variant="ghost" onClick={onCancel} className="rounded-xl font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest text-[10px] hover:bg-gray-200/50">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-10 h-12 shadow-lg shadow-teal-600/20 transition-all active:scale-95 flex items-center font-bold"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
          {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
