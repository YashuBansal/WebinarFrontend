import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContactFormSchema, type CreateContactFormData, type CreateContactPayload } from '@/schemas/contactSchema';
import type { Contact } from '@/schemas/contactSchema';
import { CountryCodeSelector } from '@/components/ui/country-code-selector';
import { TagsSelector } from '@/components/ui/tags-selector';
import { useWabaTags } from '@/hooks/useTags';
import { useProjectContext } from '@/context/ProjectContext';

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Edit Contact' : 'Create New Contact'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Hidden projectId field */}
          <input type="hidden" {...register('projectId')} value={projectId} />
          
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Enter last name"
            />
          </div>
          
          <div>
            <Label htmlFor="countryCode">Country Code *</Label>
            <CountryCodeSelector
              value={watch('countryCode')}
              onChange={(value) => setValue('countryCode', value)}
              disabled={isLoading}
            />
            {errors.countryCode && (
              <p className="text-sm text-red-500">{errors.countryCode.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              pattern="[0-9]{10}"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Enter exactly 10 digits (e.g., 9876543210)
            </p>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="tags">Tags</Label>
            <TagsSelector
              tags={wabaTags}
              value={selectedTags}
              onChange={(value) => setValue('tags', value)}
              disabled={isLoading}
              placeholder="Select tags..."
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (contact ? 'Update Contact' : 'Create Contact')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
