import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings2, 
  Trash2, 
  Save, 
  HelpCircle,
  ChevronRight,
  MousePointer2,
  Zap,
  MessageSquare,
  Sparkles,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPanel({ selectedNode, onNodeDataChange }) {
  const handleInputChange = (key, value) => {
    if (selectedNode) {
      onNodeDataChange(selectedNode.id, { [key]: value });
    }
  };

  return (
    <aside className="w-80 h-full border-l border-slate-200/60 bg-white/70 backdrop-blur-xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <Settings2 className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Node Settings</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 space-y-6"
            >
              {/* Node Type Badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                {selectedNode.type === 'trigger' && <Zap className="h-4 w-4 text-green-500" />}
                {selectedNode.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                {selectedNode.type === 'template' && <FileText className="h-4 w-4 text-indigo-500" />}
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {selectedNode.type} Node
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Label Name
                  </Label>
                  <Input 
                    placeholder="e.g. Greeting"
                    value={selectedNode.data?.label || ''}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white focus:ring-green-500/20 transition-all font-medium"
                  />
                </div>

                {selectedNode.type === 'message' && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Message Content
                    </Label>
                    <textarea 
                      className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none custom-scrollbar"
                      placeholder="Type the message for the user..."
                      value={selectedNode.data?.message || ''}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                    />
                  </div>
                )}

                {selectedNode.type === 'template' && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Choose Template
                    </Label>
                    <Select 
                      value={selectedNode.data?.templateName || ''} 
                      onValueChange={(val) => handleInputChange('templateName', val)}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white focus:ring-indigo-500/20 transition-all font-medium">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="Welcome Message">Welcome Message</SelectItem>
                        <SelectItem value="Payment Link">Payment Link</SelectItem>
                        <SelectItem value="Support Update">Support Update</SelectItem>
                        <SelectItem value="Product Catalog">Product Catalog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedNode.type === 'trigger' && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Trigger Keyword
                    </Label>
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500/50" />
                      <Input 
                        placeholder="e.g. Hello"
                        value={selectedNode.data?.label?.replace('Keyword: ', '') || ''}
                        onChange={(e) => handleInputChange('label', `Keyword: ${e.target.value}`)}
                        className="h-11 pl-10 rounded-xl border-slate-200 bg-white focus:ring-green-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.type === 'condition' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Branch 1 (True Path)
                      </Label>
                      <Input 
                        placeholder="e.g. Yes"
                        value={selectedNode.data?.trueLabel || ''}
                        onChange={(e) => handleInputChange('trueLabel', e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white focus:ring-amber-500/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Branch 2 (False Path)
                      </Label>
                      <Input 
                        placeholder="e.g. No"
                        value={selectedNode.data?.falseLabel || ''}
                        onChange={(e) => handleInputChange('falseLabel', e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white focus:ring-amber-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-11 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <span className="flex items-center gap-2 font-bold text-xs">
                      <Trash2 className="h-4 w-4" />
                      Delete Node
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="h-20 w-20 rounded-[32px] bg-slate-50 flex items-center justify-center mb-6 relative">
                 <div className="absolute inset-0 rounded-[32px] bg-slate-100 animate-ping opacity-20" />
                <MousePointer2 className="h-10 w-10 text-slate-300 relative z-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">No Selection</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[200px]">
                Click on a node in the canvas to start configuring your WhatsApp flow.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-slate-50/50 border-t border-slate-200/60 flex flex-col gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/50 border border-blue-100 mb-1">
           <Sparkles className="h-3.5 w-3.5 text-blue-500" />
           <p className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">Syncing with canvas...</p>
        </div>
        <Button className="w-full h-11 rounded-xl bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-sm shadow-lg shadow-green-600/10 transition-all active:scale-[0.98]">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </aside>
  );
}
