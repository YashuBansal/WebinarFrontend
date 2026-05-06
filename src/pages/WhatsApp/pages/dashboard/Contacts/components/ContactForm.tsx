import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContactFormSchema, type CreateContactFormData, type CreateContactPayload } from '@/schemas/contactSchema';
import type { Contact } from '@/schemas/contactSchema';
import { CountryCodeSelector } from '@/components/ui/country-code-selector';
import { TagsSelector } from '@/components/ui/tags-selector';
import { useWabaTags } from '@/hooks/useTags';
import { useProjectContext } from '@/context/ProjectContext';
import { X, User, Mail, Phone, Tag, Loader2, Save, UserPlus, Globe } from 'lucide-react';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactPayload) => Promise<void>;
  isLoading?: boolean;
  contact?: Contact | null; // For editing existing contact
  projectId: string;
}

export default function ContactForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  contact = null,
  projectId
}: ContactFormProps) {
  const { selectedProject } = useProjectContext();
  const { data: wabaTags = [] } = useWabaTags({
    projectId: selectedProject?._id,
  });

  // Derive country code and local 10-digit phone when editing
  const { derivedCountryCode, derivedLocalPhone } = useMemo(() => {
    const fullPhone = contact?.phone || '';
    const onlyDigits = fullPhone.replace(/[^0-9]/g, '');
    if (onlyDigits.length > 10) {
      const local = onlyDigits.slice(-10);
      const cc = `+${onlyDigits.slice(0, -10)}`;
      return { derivedCountryCode: cc, derivedLocalPhone: local };
    }
    // Fallbacks
    return { derivedCountryCode: '+91', derivedLocalPhone: onlyDigits };
  }, [contact]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateContactFormData>({
    resolver: zodResolver(createContactFormSchema),
    defaultValues: {
      projectId,
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      countryCode: contact ? derivedCountryCode : '+91',
      phone: contact ? derivedLocalPhone : '',
      email: contact?.email || '',
      tags: contact?.tags || [],
    },
  });

  // Reset form when switching between create and edit, or when contact changes
  useEffect(() => {
    reset({
      projectId,
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      countryCode: contact ? derivedCountryCode : '+91',
      phone: contact ? derivedLocalPhone : '',
      email: contact?.email || '',
      tags: contact?.tags || [],
    });
  }, [contact, projectId, derivedCountryCode, derivedLocalPhone, reset]);

  const selectedTags = watch('tags');

  const handleFormSubmit = async (data: CreateContactFormData) => {
    // Transform form data to API payload
    const contactData: CreateContactPayload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: `${data.countryCode.replace('+', '')}${data.phone}`,
      email: data.email,
      projectId,
      tags: data.tags || [],
    };

    try {
      await onSubmit(contactData);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting contact form:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const labelStyles = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5";
  const inputStyles = "rounded-xl border-slate-200 focus:ring-green-500/20 py-5 text-sm font-medium shadow-sm bg-white transition-all";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[550px] border-0 bg-transparent p-0 shadow-none outline-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="relative w-full rounded-2xl p-8 shadow-2xl flex flex-col bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                {contact ? <User className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                {contact ? 'Update Identity' : 'Onboard Subscriber'}
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {contact ? 'Edit Contact' : 'Create New Contact'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {contact ? 'Edit existing' : 'Create new'} contact information for the current project.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 transition-colors border border-transparent hover:border-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <input type="hidden" {...register('projectId')} value={projectId} />

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <Label htmlFor="firstName" className={labelStyles}>
                  <User className="h-3 w-3" />
                  First Name
                </Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="e.g. John"
                  className={inputStyles}
                />
                {errors.firstName && (
                  <p className="text-[10px] font-bold text-red-500 mt-1.5 uppercase tracking-wider">{errors.firstName.message}</p>
                )}
              </div>

              <div className="flex flex-col">
                <Label htmlFor="lastName" className={labelStyles}>
                  <User className="h-3 w-3 opacity-50" />
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="e.g. Doe"
                  className={inputStyles}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="email" className={labelStyles}>
                <Mail className="h-3 w-3" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john.doe@example.com"
                className={inputStyles}
              />
              {errors.email && (
                <p className="text-[10px] font-bold text-red-500 mt-1.5 uppercase tracking-wider">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 flex flex-col">
                <Label htmlFor="countryCode" className={labelStyles}>
                  <Globe className="h-3 w-3" />
                  Country
                </Label>
                <CountryCodeSelector
                  value={watch('countryCode')}
                  onChange={(value) => setValue('countryCode', value)}
                  disabled={isLoading}
                />
                {errors.countryCode && (
                  <p className="text-[10px] font-bold text-red-500 mt-1.5 uppercase tracking-wider">{errors.countryCode.message}</p>
                )}
              </div>

              <div className="col-span-2 flex flex-col">
                <Label htmlFor="phone" className={labelStyles}>
                  <Phone className="h-3 w-3" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="9876543210"
                  maxLength={10}
                  className={inputStyles}
                />
                {errors.phone && (
                  <p className="text-[10px] font-bold text-red-500 mt-1.5 uppercase tracking-wider">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="tags" className={labelStyles}>
                <Tag className="h-3 w-3" />
                Audience Tags
              </Label>
              <TagsSelector
                tags={wabaTags}
                value={selectedTags}
                onChange={(value) => setValue('tags', value)}
                disabled={isLoading}
                placeholder="Select audience tags..."
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-12 px-6 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 px-8 rounded-xl font-bold bg-[#22B573] hover:bg-[#1da467] text-white shadow-lg shadow-green-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {contact ? 'Update Contact' : 'Create Contact'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
