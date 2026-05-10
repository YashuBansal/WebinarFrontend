import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CampaignSetupProps {
  register: any;
  errors: any;
  onNext: () => void;
  watchedValues: any;
}

const CampaignSetup = ({ register, errors, onNext, watchedValues }: CampaignSetupProps) => {
  const handleNextClick = () => {
    onNext();
  };

  // Check if name field is valid
  const nameValue = watchedValues.name || '';
  const isNameValid = nameValue && nameValue.trim().length > 0;

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 bg-[#22B573] rounded-full" />
            <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">Campaign Identity</Label>
          </div>
          <div className="relative group">
            <Input
              id="name"
              placeholder="e.g. Q4 Global Outreach"
              className={`h-14 rounded-2xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 pl-12 text-base font-bold transition-all focus:bg-white focus:ring-4 focus:ring-[#22B573]/10 focus:border-[#22B573] ${errors.name ? 'border-red-300 ring-red-50' : ''}`}
              {...register('name')}
            />
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#22B573] transition-colors" />
          </div>
          {errors.name && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 pl-2"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.name.message}
            </motion.p>
          )}
        </div>
        
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            Establishing a clear campaign identity helps you track performance benchmarks and historical data across your dashboard more effectively.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          {isNameValid ? (
            <div className="flex items-center gap-1.5 text-[#22B573]">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Configuration Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Identity Required</span>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleNextClick} 
          disabled={!isNameValid}
          className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 group"
        >
          Next Step
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default CampaignSetup;
