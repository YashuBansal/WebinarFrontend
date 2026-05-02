import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            placeholder="Enter campaign name..."
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          Choose a descriptive name for your campaign. This will help you identify it later in your campaign dashboard.
        </div>
      </div>

      <div className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          {isNameValid ? '✅ Ready to proceed' : '⚠️ Enter a campaign name to continue'}
        </div>
        <Button 
          onClick={handleNextClick} 
          disabled={!isNameValid}
          className="flex items-center gap-2"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CampaignSetup;
