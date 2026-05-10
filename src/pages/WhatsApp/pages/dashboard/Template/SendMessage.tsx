import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Send, 
  Phone, 
  MessageSquare, 
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useSendTemplateMessage, useTemplates } from '@/hooks/useTemplates';
import { useProjectContext } from '@/context/ProjectContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendTemplateMessagePayloadSchema, type SendTemplateMessagePayload } from '@/schemas/templateSchema';
import { toastUtils } from '@/lib/utils';

interface SendMessageFormData {
  recipientPhoneNumber: string;
  templateName: string;
  language: string;
  bodyVariables?: string[];
  headerVariables?: string[];
}

export default function SendMessage() {
  const { selectedProject } = useProjectContext();
  const sendMessageMutation = useSendTemplateMessage();
  const { data: templatesResponse } = useTemplates(selectedProject?._id || '');
  
  const templates = templatesResponse?.data || [];
  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendMessageFormData>({
    resolver: zodResolver(sendTemplateMessagePayloadSchema.omit({ projectId: true })) as any,
    defaultValues: {
      recipientPhoneNumber: '',
      templateName: '',
      language: 'en_US',
      bodyVariables: [],
      headerVariables: [],
    },
  });

  const watchedTemplateName = watch('templateName');
  const selectedTemplate = approvedTemplates.find(t => t.name === watchedTemplateName);

  const onSubmit = async (data: SendMessageFormData) => {
    if (!selectedProject?._id) {
      toastUtils.error('Please select a project first');
      return;
    }

    try {
      const payload: SendTemplateMessagePayload = {
        projectId: selectedProject._id,
        recipientPhoneNumber: data.recipientPhoneNumber,
        templateName: data.templateName,
        language: data.language,
        bodyVariables: data.bodyVariables?.filter(v => v.trim() !== '') || [],
      };

      console.log('Sending template message:', payload);

      await sendMessageMutation.mutateAsync(payload);

      toastUtils.success('Message sent successfully!');
      
      // Reset form to default state
      reset({
        recipientPhoneNumber: '',
        templateName: '',
        language: 'en_US',
        bodyVariables: [],
        headerVariables: [],
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toastUtils.error('Failed to send message. Please check the console for details.');
    }
  };

  const addBodyVariable = () => {
    const currentVariables = watch('bodyVariables') || [];
    setValue('bodyVariables', [...currentVariables, '']);
  };

  const updateBodyVariable = (index: number, value: string) => {
    const currentVariables = watch('bodyVariables') || [];
    const updatedVariables = [...currentVariables];
    updatedVariables[index] = value;
    setValue('bodyVariables', updatedVariables);
  };

  const removeBodyVariable = (index: number) => {
    const currentVariables = watch('bodyVariables') || [];
    const filteredVariables = currentVariables.filter((_, i) => i !== index);
    setValue('bodyVariables', filteredVariables);
  };

  const addHeaderVariable = () => {
    const currentVariables = watch('headerVariables') || [];
    setValue('headerVariables', [...currentVariables, '']);
  };

  const updateHeaderVariable = (index: number, value: string) => {
    const currentVariables = watch('headerVariables') || [];
    const updatedVariables = [...currentVariables];
    updatedVariables[index] = value;
    setValue('headerVariables', updatedVariables);
  };

  const removeHeaderVariable = (index: number) => {
    const currentVariables = watch('headerVariables') || [];
    const filteredVariables = currentVariables.filter((_, i) => i !== index);
    setValue('headerVariables', filteredVariables);
  };

  const getTemplatePreview = () => {
    if (!selectedTemplate) return null;

    const bodyComponent = selectedTemplate.components.find(c => c.type === 'BODY');
    const headerComponent = selectedTemplate.components.find(c => c.type === 'HEADER');
    const footerComponent = selectedTemplate.components.find(c => c.type === 'FOOTER');

    let preview = bodyComponent?.text || '';
    
    // Replace variables with placeholders
    const bodyVariables = watch('bodyVariables') || [];
    bodyVariables.forEach((variable, index) => {
      preview = preview.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), `{{${variable || `Variable ${index + 1}`}}}`);
    });

    return {
      header: headerComponent?.text,
      body: preview,
      footer: footerComponent?.text,
    };
  };

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900/60 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Project Selected</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">Please select a project to send messages.</p>
          </div>
        </div>
      </div>
    );
  }

  const templatePreview = getTemplatePreview();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900/60 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Send Template Message</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Send WhatsApp messages using approved templates for {selectedProject.projectName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
              {/* Recipient Phone Number */}
              <Card>
                <CardHeader>
                  <CardTitle>Recipient Information</CardTitle>
                  <CardDescription>
                    Enter the phone number of the recipient (include country code).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      {...register('recipientPhoneNumber')}
                      className="pl-10"
                    />
                  </div>
                  {errors.recipientPhoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipientPhoneNumber.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Selection</CardTitle>
                  <CardDescription>
                    Select an approved template to send.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Template Name
                      </label>
                      <select
                        {...register('templateName')}
                        className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md bg-white dark:bg-slate-900/60 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a template</option>
                        {approvedTemplates.map(template => (
                          <option key={template.id} value={template.name}>
                            {template.name} ({template.category})
                          </option>
                        ))}
                      </select>
                      {errors.templateName && (
                        <p className="text-red-500 text-sm mt-1">{errors.templateName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Language
                      </label>
                      <Input
                        type="text"
                        placeholder="en_US"
                        {...register('language')}
                      />
                      {errors.language && (
                        <p className="text-red-500 text-sm mt-1">{errors.language.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Variables */}
              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Template Variables</CardTitle>
                    <CardDescription>
                      Fill in the variables for your template. Variables are replaced in the order they appear.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Body Variables */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            Body Variables
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addBodyVariable}
                          >
                            Add Variable
                          </Button>
                        </div>
                        {(watch('bodyVariables') || []).map((variable, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              placeholder={`Variable ${index + 1}`}
                              value={variable}
                              onChange={(e) => updateBodyVariable(index, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeBodyVariable(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Header Variables */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            Header Variables
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addHeaderVariable}
                          >
                            Add Variable
                          </Button>
                        </div>
                        {(watch('headerVariables') || []).map((variable, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              placeholder={`Header Variable ${index + 1}`}
                              value={variable}
                              onChange={(e) => updateHeaderVariable(index, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeHeaderVariable(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting || sendMessageMutation.isPending}
              >
                {isSubmitting || sendMessageMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Preview</CardTitle>
                <CardDescription>
                  Preview of your message before sending.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatePreview ? (
                  <div className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700/30 rounded-lg p-4 space-y-3">
                    {/* WhatsApp Logo */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">WhatsApp</span>
                    </div>

                    {/* Message Preview */}
                    <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-md space-y-2">
                      {templatePreview.header && (
                        <div className="text-sm font-medium text-gray-800 dark:text-slate-200">
                          {templatePreview.header}
                        </div>
                      )}
                      <div className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                        {templatePreview.body}
                      </div>
                      {templatePreview.footer && (
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                          {templatePreview.footer}
                        </div>
                      )}
                    </div>

                    {/* Recipient Info */}
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      To: {watch('recipientPhoneNumber') || 'Recipient phone number'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a template to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Status Info */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Status: {selectedTemplate.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Category: {selectedTemplate.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Language: {selectedTemplate.language}</span>
                    </div>
                    {selectedTemplate.quality_score && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Quality: {selectedTemplate.quality_score.score}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
