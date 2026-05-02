import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Plus, Phone, Link, Copy, Image, Video, FileText, Loader2 } from 'lucide-react';
import { useCreateTemplate } from '@/hooks/useTemplates';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { templateFormSchema, type TemplateFormData, type TemplateCategory } from '@/schemas/templateSchema';
import { useProjectContext } from '@/context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { toastUtils } from '@/lib/utils';
import { FileUploader } from '@/components/ui/FileUploader';
import type { AxiosError } from 'axios';

interface InteractiveAction {
  id: string;
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'OTP';
  title: string;
  value?: string;
  otp_type?: 'ZERO_TAP' | 'COPY_CODE';
}

interface ParsedTemplateError {
  source: 'app' | 'meta' | 'unknown';
  message: string;
  code?: string | number;
  details?: any;
}

export default function CreateTemplatePage() {
  const { selectedProject } = useProjectContext();
  const createTemplateMutation = useCreateTemplate();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      category: 'UTILITY',
      language: 'en_US',
      name: '',
      headerFormat: undefined,
      format: '',
      header: '',
      headerHandle: '',
      footer: '',
      interactiveType: 'none',
      interactiveActions: [],
    },
  });

  const watchedFormat = watch('format');
  const watchedHeaderFormat = watch('headerFormat');
  const watchedInteractiveActions = watch('interactiveActions') || [];
  const [characterCount, setCharacterCount] = useState(0);
  const [sampleValues, setSampleValues] = useState<string[]>([]);
  
  // Media upload state
  const [headerHandle, setHeaderHandle] = useState<string | null>(null);
  const [useGenericSample, setUseGenericSample] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [appErrorMessage, setAppErrorMessage] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<ParsedTemplateError | null>(null);

  const categories: TemplateCategory[] = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
  const languages = [
    { value: 'en_US', label: 'English (US)' },
    { value: 'en_GB', label: 'English (UK)' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'hi', label: 'Hindi' },
  ];
  const headerFormats = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'];

  // Update character count when format changes
  React.useEffect(() => {
    setCharacterCount(watchedFormat?.length || 0);
  }, [watchedFormat]);

  // Extract variables from template format and update sample values
  React.useEffect(() => {
    if (watchedFormat) {
      const variables = extractVariablesFromText(watchedFormat);
      setSampleValues(new Array(variables.length).fill(''));
    } else {
      setSampleValues([]);
    }
  }, [watchedFormat]);

  // Function to extract variable placeholders from template text
  const extractVariablesFromText = (text: string): string[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  // Function to replace variables with sample values for preview
  const replaceVariablesWithSamples = (text: string, samples: string[]): string => {
    let result = text;
    samples.forEach((sample, index) => {
      const placeholder = `{{${index + 1}}}`;
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), sample || placeholder);
    });
    return result;
  };

  const parseTemplateError = (error: unknown): ParsedTemplateError => {
    const axiosError = error as AxiosError<any>;
    const data: any = axiosError?.response?.data;
    console.log('Parsed template error:', data);

    const source: ParsedTemplateError['source'] =
      data?.source === 'meta'
        ? 'meta'
        : data?.source === 'app'
        ? 'app'
        : 'unknown';

    const message =
      data?.message ||
      data?.error?.message ||
      axiosError?.message ||
      'Something went wrong while creating the template.';

    const code =
      data?.code ??
      data?.error?.code ??
      data?.error?.error_subcode ??
      axiosError?.response?.status;

    const details = data?.details ?? data?.error ?? data;

    return { source, message, code, details };
  };

  const addInteractiveAction = (type: InteractiveAction['type']) => {
    const newAction: InteractiveAction = {
      id: Date.now().toString(),
      type,
      title: '',
      value: '',
      ...(type === 'OTP' && { otp_type: 'COPY_CODE' })
    };
    const currentActions = watchedInteractiveActions;
    setValue('interactiveActions', [...currentActions, newAction]);
  };

  const updateInteractiveAction = (id: string, field: keyof InteractiveAction, value: string) => {
    const currentActions = watchedInteractiveActions;
    const updatedActions = currentActions.map(action => 
      action.id === id ? { ...action, [field]: value } : action
    );
    setValue('interactiveActions', updatedActions);
  };

  const removeInteractiveAction = (id: string) => {
    const currentActions = watchedInteractiveActions;
    const filteredActions = currentActions.filter(action => action.id !== id);
    setValue('interactiveActions', filteredActions);
  };

  const handleSampleValueChange = (index: number, value: string) => {
    const newSampleValues = [...sampleValues];
    newSampleValues[index] = value;
    setSampleValues(newSampleValues);
  };

  const onSubmit = async (data: TemplateFormData) => {
    if (!selectedProject?._id) {
      toastUtils.error('Please select a project first');
      return;
    }

    // Clear previous error banners
    setAppErrorMessage(null);
    setMetaError(null);

    // Validate sample values for variables
    const variables = extractVariablesFromText(data.format);
    if (variables.length > 0) {
      const missingSampleValues = sampleValues.some((value, index) => 
        index < variables.length && (!value || value.trim() === '')
      );
      
      if (missingSampleValues) {
        toastUtils.error('Please provide sample values for all template variables ({{1}}, {{2}}, etc.)');
        return;
      }
    }

    // Validate header format requirements only if header format is selected and content is provided
    if (data.headerFormat === 'TEXT' && data.header && data.header.trim() !== '') {
      // Header text is provided, validate it
      if (data.header.length > 60) {
        toastUtils.error('Header text must not exceed 60 characters');
        return;
      }
    }
    
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(data.headerFormat || '')) {
      const currentHeaderHandle = useGenericSample ? getGenericSampleHandle() : headerHandle;
      if (currentHeaderHandle) {
        // Media sample is provided, validate it
        // Additional validation can be added here if needed
      }
    }

    try {
      // Transform form data to API format
      const components: any[] = [];

      // Add header component only if header format is selected AND has content
      if (data.headerFormat) {
        let shouldAddHeader = false;
        const headerComponent: any = {
          type: 'HEADER',
          format: data.headerFormat,
        };

        if (data.headerFormat === 'TEXT' && data.header && data.header.trim() !== '') {
          headerComponent.text = data.header;
          shouldAddHeader = true;
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(data.headerFormat)) {
          const currentHeaderHandle = useGenericSample ? getGenericSampleHandle() : headerHandle;
          if (currentHeaderHandle) {
            headerComponent.example = {
              header_handle: [currentHeaderHandle]
            };
            shouldAddHeader = true;
          }
        } else if (data.headerFormat === 'LOCATION') {
          // LOCATION format doesn't need additional properties but can be added
          shouldAddHeader = true;
        }
        
        if (shouldAddHeader) {
          components.push(headerComponent);
        }
      }

      // Add body component
      components.push({
        type: 'BODY',
        text: data.format,
        ...(sampleValues.length > 0 && {
          example: {
            body_text: [sampleValues]
          }
        })
      });

      // Add footer if provided
      if (data.footer && data.footer.trim() !== '') {
        components.push({
          type: 'FOOTER',
          text: data.footer,
        });
      }

      // Add buttons if interactive actions exist and have titles
      if (data.interactiveActions && data.interactiveActions.length > 0) {
        const validActions = data.interactiveActions.filter(action => action.title && action.title.trim() !== '');
        
        if (validActions.length > 0) {
          const buttons = validActions.map(action => {
            const button: any = {
              type: action.type,
              text: action.title,
            };

            if (action.type === 'URL' && action.value) {
              button.url = action.value;
            } else if (action.type === 'PHONE_NUMBER' && action.value) {
              button.phone_number = action.value;
            } else if (action.type === 'OTP' && action.otp_type) {
              button.otp_type = action.otp_type;
            }

            return button;
          });

          components.push({
            type: 'BUTTONS',
            buttons,
          });
        }
      }

      const createTemplatePayload = {
        name: data.name,
        category: data.category,
        language: data.language,
        components,
      };

      console.log('Submitting template:', createTemplatePayload);

      await createTemplateMutation.mutateAsync({
        projectId: selectedProject._id,
        payload: createTemplatePayload,
        navigate: navigate,
      });
    } catch (error) {
      console.error('Failed to create template from page submit:', error);
      const parsed = parseTemplateError(error);

      if (parsed.source === 'meta') {
        setMetaError(parsed);
        setAppErrorMessage(null);
      } else {
        setAppErrorMessage(parsed.message);
        setMetaError(null);
      }
    }
  };

  const getActionCount = (type: InteractiveAction['type']) => {
    return watchedInteractiveActions.filter(action => action.type === type).length;
  };

  const getActionIcon = (type: InteractiveAction['type']) => {
    switch (type) {
      case 'QUICK_REPLY': return <Plus className="w-4 h-4" />;
      case 'URL': return <Link className="w-4 h-4" />;
      case 'PHONE_NUMBER': return <Phone className="w-4 h-4" />;
      case 'OTP': return <Copy className="w-4 h-4" />;
    }
  };

  // Media upload handlers
  const handleFileSelect = () => {
    setUploadError('');
  };

  const handleUploadSuccess = (result: any) => {
    setHeaderHandle(result.data.headerHandle);
    toastUtils.success('Sample file uploaded successfully!');
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    toastUtils.error(error);
  };

  const getFileAcceptTypes = () => {
    switch (watchedHeaderFormat) {
      case 'IMAGE':
        return 'image/jpeg,image/png,image/jpg';
      case 'VIDEO':
        return 'video/mp4,video/3gpp';
      case 'DOCUMENT':
        return 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return '*';
    }
  };

  const getMaxFileSize = () => {
    switch (watchedHeaderFormat) {
      case 'IMAGE':
        return 2; // 2MB
      case 'VIDEO':
      case 'DOCUMENT':
        return 16; // 16MB
      default:
        return 16;
    }
  };

  // Generic sample handles (you can replace these with actual handles from your Meta account)
  const getGenericSampleHandle = () => {
    switch (watchedHeaderFormat) {
      case 'IMAGE':
        return 'generic_image_handle'; // Replace with actual handle
      case 'VIDEO':
        return 'generic_video_handle'; // Replace with actual handle
      case 'DOCUMENT':
        return 'generic_document_handle'; // Replace with actual handle
      default:
        return null;
    }
  };

  return (
    <div className=" overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Template</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Template Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Category</CardTitle>
                  <CardDescription>
                    Your template should fall under one of these categories.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <select
                      {...register('category')}
                      className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Template Language */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Language</CardTitle>
                  <CardDescription>
                    You will need to specify the language in which message template is submitted.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <select
                      {...register('language')}
                      className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select message language</option>
                      {languages.map(language => (
                        <option key={language.value} value={language.value}>{language.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {errors.language && (
                    <p className="text-red-500 text-sm mt-1">{errors.language.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Template Name */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Name</CardTitle>
                  <CardDescription>
                    Name can only be in lowercase alphanumeric characters and underscores. Special characters and white-space are not allowed e.g. - app_verification_code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    placeholder="Enter name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Header Format */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Type</CardTitle>
                  <CardDescription>
                    Choose the type for your template. TEXT allows custom text, while media formats require uploaded assets.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <select
                      {...register('headerFormat')}
                      className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select template type</option>
                      {headerFormats.map(format => (
                        <option key={format} value={format}>{format}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </CardContent>
              </Card>


           
              {/* Template Format */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Format</CardTitle>
                  <CardDescription>
                    Use text formatting - *bold*, _italic_, & ~strikethrough~ Your message content. Upto 1024 characters are allowed. e.g. - Hello {`{{1}}`}, your code will expire in {`{{2}}`} mins.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    placeholder="Enter your message in here..."
                    {...register('format')}
                    className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={1024}
                  />
                  <div className="text-sm text-gray-500 mt-2">
                    {characterCount}/1024
                  </div>
                  {errors.format && (
                    <p className="text-red-500 text-sm mt-1">{errors.format.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Template Header Text */}
              {watchedHeaderFormat === 'TEXT' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Template Header Text</CardTitle>
                    <CardDescription>
                      Header text for your template. Upto 60 characters are allowed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="text"
                      placeholder="Enter header text here"
                      {...register('header')}
                      maxLength={60}
                    />
                    {errors.header && (
                      <p className="text-red-500 text-sm mt-1">{errors.header.message}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Media Upload Section */}
              {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(watchedHeaderFormat || '') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Media Sample Upload</CardTitle>
                    <CardDescription>
                      Upload a sample file for your {watchedHeaderFormat?.toLowerCase()} template. This will be used for template approval.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Generic Sample Option */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-generic-sample"
                        checked={useGenericSample}
                        onCheckedChange={(checked) => {
                          setUseGenericSample(checked as boolean);
                          if (checked) {
                            setHeaderHandle(null);
                            setUploadError('');
                          }
                        }}
                      />
                      <Label htmlFor="use-generic-sample" className="text-sm">
                        Use a generic sample (recommended for testing)
                      </Label>
                    </div>

                    {/* File Uploader */}
                    {!useGenericSample && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Upload Your Own Sample
                        </Label>
                        <FileUploader
                          onFileSelect={handleFileSelect}
                          onUploadSuccess={handleUploadSuccess}
                          onUploadError={handleUploadError}
                          accept={getFileAcceptTypes()}
                          maxSize={getMaxFileSize()}
                          uploadEndpoint={
                            selectedProject
                              ? `/whatsapp/templates/${selectedProject._id}/upload-sample-media`
                              : ''
                          }
                          uploadFieldName="file"
                        />
                        {uploadError && (
                          <p className="text-red-500 text-sm mt-2">{uploadError}</p>
                        )}
                      </div>
                    )}

                    {/* Upload Status */}
                    {(headerHandle || useGenericSample) && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>✓ Sample Ready:</strong> {useGenericSample ? 'Using generic sample' : 'Custom sample uploaded successfully'}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        <strong>Supported formats:</strong>
                        <br />• IMAGE: JPG, PNG (max 2MB)
                        <br />• VIDEO: MP4, 3GPP (max 16MB)
                        <br />• DOCUMENT: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX (max 16MB)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sample Values for Variables */}
              {sampleValues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Values for Variables</CardTitle>
                    <CardDescription>
                      Provide sample values for template variables. These are required for template approval.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sampleValues.map((value, index) => (
                        <div key={index} className="space-y-1">
                          <Label htmlFor={`sample-${index}`} className="text-sm font-medium">
                            Sample value for {`{{${index + 1}}}`}:
                          </Label>
                          <Input
                            id={`sample-${index}`}
                            placeholder={`Enter sample value for {{${index + 1}}}`}
                            value={value}
                            onChange={(e) => handleSampleValueChange(index, e.target.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> Sample values help WhatsApp understand how your template will be used. 
                        Make sure to provide realistic examples that represent actual use cases.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Template Footer */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Footer (Optional)</CardTitle>
                  <CardDescription>
                    Your message content. Upto 60 characters are allowed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    placeholder="Enter footer text here"
                    {...register('footer')}
                    maxLength={60}
                  />
                  {errors.footer && (
                    <p className="text-red-500 text-sm mt-1">{errors.footer.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Interactive Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Actions</CardTitle>
                  <CardDescription>
                    In addition to your message, you can send actions with your message. Maximum 25 characters are allowed in CTA button title & Quick Replies.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Radio Buttons */}
                    <div className="space-y-2">
                      {['none', 'call_to_actions', 'quick_replies', 'all'].map((option) => (
                        <label key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            {...register('interactiveType')}
                            value={option}
                            className="text-blue-600"
                          />
                          <span className="capitalize">{option.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addInteractiveAction('QUICK_REPLY')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Quick Replies {getActionCount('QUICK_REPLY')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addInteractiveAction('URL')}
                        className="flex items-center gap-2"
                      >
                        <Link className="w-4 h-4" />
                        URL {getActionCount('URL')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addInteractiveAction('PHONE_NUMBER')}
                        className="flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Phone Number {getActionCount('PHONE_NUMBER')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addInteractiveAction('OTP')}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        OTP {getActionCount('OTP')}
                      </Button>
                    </div>

                    {/* Interactive Actions List */}
                    {watchedInteractiveActions.map((action) => (
                      <div key={action.id} className="border border-gray-200 rounded-md p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {getActionIcon(action.type)}
                            {action.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInteractiveAction(action.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                        <Input
                          placeholder="Enter title"
                          value={action.title}
                          onChange={(e) => updateInteractiveAction(action.id, 'title', e.target.value)}
                          maxLength={25}
                        />
                        {(action.type === 'URL' || action.type === 'PHONE_NUMBER') && (
                          <Input
                            placeholder={action.type === 'URL' ? 'Enter URL' : 'Enter phone number'}
                            value={action.value || ''}
                            onChange={(e) => updateInteractiveAction(action.id, 'value', e.target.value)}
                          />
                        )}
                        {action.type === 'OTP' && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">OTP Type</Label>
                            <div className="relative">
                              <select
                                value={action.otp_type || 'COPY_CODE'}
                                onChange={(e) => updateInteractiveAction(action.id, 'otp_type', e.target.value)}
                                className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="COPY_CODE">Copy Code</option>
                                <option value="ZERO_TAP">Zero Tap</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Error Banners - Display above Submit Button */}
              {appErrorMessage && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-semibold">There was a problem with your template.</p>
                  <p className="mt-1">{appErrorMessage}</p>
                  <p className="mt-1 text-xs opacity-80">
                    Please review your template details and try again.
                  </p>
                </div>
              )}
              {metaError && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  <p className="font-semibold">
                    WhatsApp (Meta) rejected this template request.
                  </p>
                  <p className="mt-1">{metaError.message}</p>
                  
                  {/* Display user-friendly error message from Meta if available */}
                  {metaError.details?.error?.error_user_msg && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded border-l-4 border-yellow-400">
                      <p className="font-medium text-xs mb-1">
                        {metaError.details.error.error_user_title || 'Meta Feedback:'}
                      </p>
                      <p className="text-xs">
                        {metaError.details.error.error_user_msg}
                      </p>
                    </div>
                  )}
                  
                  {/* Display error code and subcode if available */}
                  {(metaError.code || metaError.details?.error?.error_subcode) && (
                    <div className="mt-2 text-xs opacity-80 space-y-1">
                      {metaError.code && (
                        <p>Error code: {metaError.code}</p>
                      )}
                      {metaError.details?.error?.error_subcode && (
                        <p>Error subcode: {metaError.details.error.error_subcode}</p>
                      )}
                      {metaError.details?.error?.type && (
                        <p>Error type: {metaError.details.error.type}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                disabled={
                  isSubmitting || 
                  createTemplateMutation.isPending
                }
              >
                {isSubmitting || createTemplateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Template...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </form>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  Your template message preview. It will update as you fill in the values in the form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  {/* WhatsApp Logo */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </div>

                  {/* Header Preview */}
                  {watchedHeaderFormat && (
                    <div className="mb-3">
                      {watchedHeaderFormat === 'TEXT' && watch('header') && (
                        <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                          <p className="text-sm font-medium text-blue-800">
                            {watch('header')}
                          </p>
                        </div>
                      )}
                      {watchedHeaderFormat === 'IMAGE' && (
                        <div className="w-full h-32 bg-yellow-100 rounded-md flex items-center justify-center border-2 border-dashed border-yellow-300">
                          <div className="text-center">
                            <Image className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                            <p className="text-xs text-yellow-700">Image Header</p>
                          </div>
                        </div>
                      )}
                      {watchedHeaderFormat === 'VIDEO' && (
                        <div className="w-full h-32 bg-blue-100 rounded-md flex items-center justify-center border-2 border-dashed border-blue-300">
                          <div className="text-center">
                            <Video className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-xs text-blue-700">Video Header</p>
                          </div>
                        </div>
                      )}
                      {watchedHeaderFormat === 'DOCUMENT' && (
                        <div className="w-full h-32 bg-pink-100 rounded-md flex items-center justify-center border-2 border-dashed border-pink-300">
                          <div className="text-center">
                            <FileText className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                            <p className="text-xs text-pink-700">Document Header</p>
                          </div>
                        </div>
                      )}
                      {watchedHeaderFormat === 'LOCATION' && (
                        <div className="w-full h-32 bg-green-100 rounded-md flex items-center justify-center border-2 border-dashed border-green-300">
                          <div className="text-center">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white text-xs">📍</span>
                            </div>
                            <p className="text-xs text-green-700">Location Header</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                  {/* Message Preview */}
                  {watchedFormat && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">
                        {sampleValues.length > 0 
                          ? replaceVariablesWithSamples(watchedFormat, sampleValues)
                          : watchedFormat
                        }
                      </p>
                      {watch('footer') && (
                        <p className="text-xs text-gray-500 mt-2">{watch('footer')}</p>
                      )}
                    </div>
                  )}

                  {/* Interactive Actions Preview */}
                  {watchedInteractiveActions.length > 0 && (
                    <div className="space-y-2">
                      {watchedInteractiveActions.map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          {action.title || `${action.type.replace('_', ' ')} button`}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>Disclaimer:</strong> This is just a graphical representation of the message that will be delivered. Actual message will consist of media selected and may appear different.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
