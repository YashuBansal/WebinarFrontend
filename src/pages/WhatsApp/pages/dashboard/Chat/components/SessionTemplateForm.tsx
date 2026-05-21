import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Send, Image, X, Info, Zap } from 'lucide-react';
import { MediaFileDialog } from '@/components/ui/MediaFileDialog';
import { WhatsAppTemplatePreviewCard } from '@/components/ui/whatsapp-template-preview-card';

interface SessionTemplateFormProps {
  quickReplies: any[];
  mediaAssetsData: any;
  mediaAssetsLoading: boolean;
  mediaAssetsError: any;
  onSend: (text: string, components?: any[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function SessionTemplateForm({
  quickReplies,
  mediaAssetsData,
  mediaAssetsLoading,
  mediaAssetsError,
  onSend,
  onCancel,
  isSubmitting
}: SessionTemplateFormProps) {
  const [selectedQR, setSelectedQR] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [headerMediaAssetId, setHeaderMediaAssetId] = useState<string | null>(null);
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);
  const [variableValues, setVariableValues] = useState<Record<number, string>>({});

  const handleQRSelect = (qr: any) => {
    setSelectedQR(qr);
    setIsDropdownOpen(false);
    setHeaderMediaAssetId(null);
    setSelectedMediaAsset(null);
    setVariableValues({});
  };

  // Detect variables in body text
  const detectedVariables = useMemo(() => {
    if (!selectedQR) return [];
    const body = selectedQR.components?.find((c: any) => c.type === 'BODY')?.text || selectedQR.content || '';
    const matches = body.match(/\{\{\d+\}\}/g) || [];
    // Extract unique indices: {{1}}, {{2}} -> [1, 2]
    const indices = Array.from(new Set(matches.map((m: string) => parseInt(m.replace(/\{\{|\}\}/g, ''))))) as number[];
    return indices.sort((a, b) => a - b);
  }, [selectedQR]);

  const handleVariableChange = (index: number, value: string) => {
    setVariableValues(prev => ({ ...prev, [index]: value }));
  };

  const getProcessedContent = () => {
    if (!selectedQR) return '';
    let content = selectedQR.components?.find((c: any) => c.type === 'BODY')?.text || selectedQR.content || '';
    detectedVariables.forEach(index => {
      const val = variableValues[index] || `{{${index}}}`;
      content = content.replace(new RegExp(`\\{\\{${index}\\}\\}`, 'g'), val);
    });
    return content;
  };

  const hasMediaHeader = () => {
    if (!selectedQR || !selectedQR.components) return false;
    const header = selectedQR.components.find((c: any) => c.type === 'HEADER');
    return header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format);
  };

  const getHeaderFormat = () => {
    if (!selectedQR || !selectedQR.components) return null;
    const header = selectedQR.components.find((c: any) => c.type === 'HEADER');
    return header?.format || null;
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

  const handleSubmit = async () => {
    if (!selectedQR) return;

    const processedContent = getProcessedContent();
    const updatedComponents = JSON.parse(JSON.stringify(selectedQR.components || []));

    // Update body text in components with replaced variables
    const bodyComp = updatedComponents.find((c: any) => c.type === 'BODY');
    if (bodyComp) {
      bodyComp.text = processedContent;
    }

    // Attach media if selected
    if (selectedMediaAsset) {
      const headerComp = updatedComponents.find((c: any) => c.type === 'HEADER');
      if (headerComp) {
        headerComp.text = selectedMediaAsset.filePath;
        headerComp.example = { header_handle: [selectedMediaAsset.filePath] };
      }
    }

    await onSend(processedContent, updatedComponents);
    onCancel();
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-200">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Send Session Template</h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium italic">Instant send • Bypass Meta Approval</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>      <div className="p-6 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Left Column: Selector + Inputs (60%) */}
            <div className="lg:col-span-3 space-y-8">
              {/* Template Selector */}
              <div className="space-y-3">
                <Label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Select Session Template</Label>
                <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-14 px-5 border-gray-200 dark:border-slate-700/50 hover:border-amber-500/50 hover:bg-amber-50/10 transition-all rounded-2xl shadow-sm bg-white dark:bg-slate-900/50">
                      {selectedQR ? (
                        <div className="flex flex-col items-start text-left">
                          <span className="font-bold text-[15px] text-gray-800 dark:text-slate-200">{selectedQR.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">Quick Reply • ID: {selectedQR._id?.slice(-6)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium">Search session templates...</span>
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
                      <CommandInput placeholder="Search quick replies..." className="h-12 border-none focus:ring-0 outline-none" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No session templates found.</CommandEmpty>
                        <CommandGroup>
                          {quickReplies.map((qr) => (
                            <CommandItem
                              key={qr._id}
                              onSelect={() => handleQRSelect(qr)}
                              className="p-4 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-none"
                            >
                              <Check className={`mr-3 h-4 w-4 text-amber-600 ${selectedQR?._id === qr._id ? 'opacity-100' : 'opacity-0'}`} />
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-700 dark:text-slate-200">{qr.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight line-clamp-1">{qr.content}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedQR && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                  {/* Media Header Section */}
                  {hasMediaHeader() && (
                    <div className="space-y-3 bg-gray-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <Label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Image className="h-3.5 w-3.5 text-amber-500" />
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
                        <Button variant="outline" className={`w-full justify-start h-14 rounded-xl border-dashed border-2 transition-all ${selectedMediaAsset ? 'border-amber-500 bg-amber-50/30 text-amber-700' : 'hover:border-amber-500/50 hover:bg-amber-50/5 text-gray-500 dark:text-slate-400'}`}>
                          <Image className={`h-5 w-5 mr-3 ${selectedMediaAsset ? 'text-amber-600' : 'text-amber-400'}`} />
                          <span className="font-semibold truncate">
                            {selectedMediaAsset ? selectedMediaAsset.fileName : `Pick a ${getHeaderFormat()?.toLowerCase()}...`}
                          </span>
                        </Button>
                      </MediaFileDialog>
                    </div>
                  )}

                  {/* Variables Section */}
                  {detectedVariables.length > 0 ? (
                    <div className="space-y-4">
                      <Label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        Template Variables
                      </Label>
                      <div className="grid gap-5">
                        {detectedVariables.map((index) => (
                          <div key={index} className="space-y-2 group">
                            <Label htmlFor={`var-${index}`} className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 ml-1 group-focus-within:text-amber-600 transition-colors uppercase tracking-wider">
                              Variable {'{{'}{index}{'}}'}
                            </Label>
                            <Input
                              id={`var-${index}`}
                              placeholder={`Value for {{${index}}}`}
                              className="h-12 rounded-xl border-gray-200 dark:border-slate-700/50 focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all bg-white dark:bg-slate-900/50"
                              value={variableValues[index] || ''}
                              onChange={(e) => handleVariableChange(index, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 border border-gray-200 dark:border-slate-800 rounded-3xl bg-[#efeae2] dark:bg-slate-950/40 shadow-inner relative overflow-hidden">
                      <div className="h-12 w-12 rounded-full bg-amber-500/10 dark:bg-amber-900/20 flex items-center justify-center mb-3 z-10">
                        <Info className="h-6 w-6 text-amber-600/70" />
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
                {selectedQR ? (
                  <div className="bg-[#efeae2] dark:bg-slate-950/40 rounded-[2.5rem] p-8 border border-gray-200 dark:border-slate-800 shadow-inner relative overflow-hidden flex items-center justify-center min-h-[500px]">
                    <div className="relative z-10 w-full animate-in zoom-in-95 duration-500">
                      <WhatsAppTemplatePreviewCard
                        template={{
                          name: selectedQR.name,
                          category: 'SESSION',
                          language: 'en_US',
                          components: (selectedQR.components || []).map((c: any) => {
                            if (c.type === 'BODY') return { ...c, text: getProcessedContent() };
                            if (c.type === 'HEADER' && selectedMediaAsset) return { ...c, text: selectedMediaAsset.filePath, example: { header_handle: [selectedMediaAsset.filePath] } };
                            return c;
                          })
                        } as any}
                        variableMappings={[]}
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
                        <Zap className="h-10 w-10 text-gray-400 dark:text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-[0.2em] mb-4">No Template Selected</h3>
                      <p className="text-gray-500 dark:text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
                        Choose a template from the list to see how it will look on your customers' phones.
                      </p>
                    </div>

                    {/* Floating Say Hi! Bubble */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 p-2 pr-5 rounded-full shadow-xl animate-bounce-subtle">
                      <div className="h-10 w-10 rounded-full bg-amber-500 overflow-hidden border-2 border-amber-400/30">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Session" alt="avatar" className="h-full w-full object-cover" />
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
          disabled={!selectedQR || isSubmitting}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-10 h-12 shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center font-bold"
        >
          {isSubmitting ? 'Sending...' : 'Send Session Template'}
          {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
