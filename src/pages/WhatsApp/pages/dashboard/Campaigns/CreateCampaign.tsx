import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Users, MessageSquare, Send } from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useCreateCampaign } from '@/hooks/useCampaigns';
import { contactsApi } from '@/api/modules/contactsAPI';
import type { PaginatedContactsResponse } from '@/schemas/contactSchema';
import { useWabaTags } from '@/hooks/useTags';
import { toastUtils } from '@/lib/utils';
import {
    campaignSetupSchema,
    contactSelectionSchema,
    templateSelectionSchema,
    campaignSendSchema,
    type CampaignSetupData,
    type ContactSelectionData,
    type TemplateSelectionData,
    type CampaignSendData,
    type CreateCampaignPayload,
    type CampaignContact,
    type CampaignTemplate,
    type VariableMapping,
    type WlhAttendeeFilterState,
} from '@/schemas/campaignSchema';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDateTime12 } from '@/lib/date';

// Step components
import CampaignSetup from './steps/CampaignSetup';
import ContactSelection from './steps/ContactSelection';
import TemplateSelection from './steps/TemplateSelection';
import CampaignPreview from './steps/CampaignPreview';
import { CotactType } from '@/types';

const STEPS = [
    { id: 1, title: 'Campaign Setup', description: 'Define your campaign', icon: MessageSquare },
    { id: 2, title: 'Select Contacts', description: 'Choose your audience', icon: Users },
    { id: 3, title: 'Choose Template', description: 'Select message template', icon: MessageSquare },
    { id: 4, title: 'Preview & Send', description: 'Review and launch', icon: Send },
];

type CampaignFormData = CampaignSetupData & ContactSelectionData & TemplateSelectionData & CampaignSendData;

const CreateCampaign = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { selectedProject } = useProjectContext();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedContacts, setSelectedContacts] = useState<CampaignContact[]>([]);
    const [wlhAttendeeFilters, setWlhAttendeeFilters] = useState<WlhAttendeeFilterState>({
        filters: null,
        contactCount: 0,
        isAttended: null,
    });
    const [contactType, setContactType] = useState<string>(CotactType.WHATSAPP);
    const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
    const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
    const [headerMediaAssetId, setHeaderMediaAssetId] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<CampaignFormData>({
        resolver: zodResolver(campaignSetupSchema.merge(contactSelectionSchema).merge(templateSelectionSchema).merge(campaignSendSchema)),
        defaultValues: {
            name: '',
            selectedContacts: [],
            templateName: '',
            sendType: 'now',
        },
        mode: 'onChange', // Enable real-time validation
    });

    const watchedValues = watch();
    console.log('errors', errors);

    const { data: contactsData, isLoading: contactsLoading } = useQuery<
        PaginatedContactsResponse,
        AxiosError
    >({
        queryKey: ['contacts', 'campaign-wizard', selectedProject?._id],
        queryFn: () =>
            contactsApi.fetchAllContactsForCampaign(selectedProject!._id),
        enabled: !!selectedProject?._id,
        staleTime: 1000 * 60 * 5,
    });

    const createCampaignMutation = useCreateCampaign();
    const { data: createdTags = [] } = useWabaTags({
        projectId: selectedProject?._id,
    });

    // Update form when selections change
    useEffect(() => {
        setValue('selectedContacts', selectedContacts.map(contact => contact._id));
    }, [selectedContacts, setValue]);

    useEffect(() => {
        if (selectedTemplate) {
            setValue('templateName', selectedTemplate.name);
        }
    }, [selectedTemplate, setValue]);

    useEffect(() => {
        setValue('variableMappings', variableMappings);
    }, [variableMappings, setValue]);

    const handleNext = async () => {
        let isValid = false;

        // Validate only the current step's fields
        switch (currentStep) {
            case 1:
                // For step 1, just check if name field has a value
                const nameValue = watchedValues.name;
                isValid = Boolean(nameValue && nameValue.trim().length > 0);
                break;
            case 2:
                if (contactType === 'whatsapp') {
                    isValid = selectedContacts.length > 0;
                } else {
                    isValid = Boolean(wlhAttendeeFilters.filters);
                }
                break;
            case 3:
                isValid = selectedTemplate !== null;
                break;
            case 4:
                isValid = true; // Final step, no additional validation needed
                break;
            default:
                isValid = false;
        }

        if (isValid && currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const onSubmit = async (data: CampaignFormData) => {
        if (!selectedProject?._id) {
            toastUtils.error('No project selected');
            return;
        }

        if (selectedContacts.length === 0 && contactType === 'whatsapp') {
            toastUtils.error('Please select at least one contact');
            return;
        }


        if (contactType === 'wlh' && (wlhAttendeeFilters.filters === null || wlhAttendeeFilters.isAttended === null)) {
            toastUtils.error('Please configure WLH filters and attendance segment');
            return;
        }

        if (!selectedTemplate) {
            toastUtils.error('Please select a template');
            return;
        }

        const payload: CreateCampaignPayload = {
            name: data.name,
            projectId: selectedProject._id,
            selectedContacts: selectedContacts.map(contact => ({
                contactId: contact._id,
                phoneNumber: contact.phone,
            })),
            templateName: selectedTemplate.name,
            variableMappings,
            sendType: data.sendType,
            scheduledAt: data.sendType === 'scheduled' ? data.scheduledAt : undefined,
            headerMediaAssetId: headerMediaAssetId || undefined,
            contactType: 'whatsapp',
        };

        if (contactType === 'wlh') {
            if (!wlhAttendeeFilters.filters || wlhAttendeeFilters.isAttended === null) {
                toastUtils.error('Please configure WLH filters and attendance segment');
                return;
            }

            payload.selectedContacts = [];
            payload.contactType = 'wlh';
            payload.wlhAttendeeFilters = {
                filters: wlhAttendeeFilters.filters,
                contactCount: wlhAttendeeFilters.contactCount,
                isAttended: wlhAttendeeFilters.isAttended,
            };
        }

        try {
            await createCampaignMutation.mutateAsync(payload);
            
            if (data.sendType === 'scheduled') {
                toastUtils.success(`Campaign "${data.name}" scheduled for ${formatDateTime12(data.scheduledAt!)}`);
            } else {
                toastUtils.success('Campaign created and executed successfully!');
            }
            
            navigate(`/whatsapp/dashboard/${projectId}/campaigns`);
        } catch (error) {
            console.error('Failed to create campaign:', error);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <CampaignSetup
                        register={register}
                        errors={errors}
                        onNext={handleNext}
                        watchedValues={watchedValues}
                    />
                );
            case 2:
                return (
                    <ContactSelection
                        contacts={contactsData?.contacts || []}
                        createdTags={createdTags.map((tag) => tag.name)}
                        isLoading={contactsLoading}
                        selectedContacts={selectedContacts}
                        onSelectionChange={setSelectedContacts}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        wlhAttendeeFilters={wlhAttendeeFilters}
                        setWlhAttendeeFilters={setWlhAttendeeFilters}
                        contactType={contactType}
                        setContactType={setContactType}
                    />
                );
            case 3:
                return (
                    <TemplateSelection
                        selectedTemplate={selectedTemplate}
                        onTemplateSelect={setSelectedTemplate}
                        variableMappings={variableMappings}
                        onVariableMappingsChange={setVariableMappings}
                        headerMediaAssetId={headerMediaAssetId}
                        onHeaderMediaAssetIdChange={setHeaderMediaAssetId}
                        uploadedFileName={uploadedFileName}
                        onUploadedFileNameChange={setUploadedFileName}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        contactType={contactType}
                    />
                );
            case 4:
                return (
                    <CampaignPreview
                        campaignData={watchedValues}
                        selectedContacts={selectedContacts}
                        selectedTemplate={selectedTemplate}
                        variableMappings={variableMappings}
                        onSubmit={handleSubmit(onSubmit)}
                        onPrevious={handlePrevious}
                        isSubmitting={createCampaignMutation.isPending}
                        setValue={setValue}
                        watchedValues={watchedValues}
                        wlhAttendeeFilters={wlhAttendeeFilters}
                        contactType={contactType}
                        headerMediaAssetId={headerMediaAssetId}
                    />
                );
            default:
                return null;
        }
    };

    if (!selectedProject) {
        return (
            <div className="flex items-center justify-center h-64">
                <Alert>
                    <AlertDescription>
                        Please select a project to create campaigns.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create New Campaign
                </h1>
            </div>

            {/* Progress */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Step {currentStep} of {STEPS.length}</span>
                            <span className="text-sm text-muted-foreground">
                                {Math.round((currentStep / STEPS.length) * 100)}% Complete
                            </span>
                        </div>
                        <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />

                        {/* Step indicators */}
                        <div className="flex items-center justify-between">
                            {STEPS.map((step) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;

                                return (
                                    <div key={step.id} className="flex flex-col items-center space-y-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isActive
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <Icon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'
                                                }`}>
                                                {step.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {(() => {
                            const Icon = STEPS[currentStep - 1].icon;
                            return Icon ? <Icon className="h-5 w-5" /> : null;
                        })()}
                        {STEPS[currentStep - 1].title}
                    </CardTitle>
                    <CardDescription>
                        {STEPS[currentStep - 1].description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderStep()}
                </CardContent>
            </Card>

            {/* Error Display */}
            {createCampaignMutation.isError && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Failed to create campaign: {(createCampaignMutation.error as any)?.response?.data?.message || 'Unknown error'}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};

export default CreateCampaign;
