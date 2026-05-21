import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    CheckCircle, 
    Users, 
    MessageSquare, 
    Send, 
    ArrowLeft, 
    Settings2, 
    LayoutGrid, 
    Target,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Calendar,
    Zap
} from 'lucide-react';
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
    createCampaignWorkflowSchema,
    type CreateCampaignWorkflowData,
} from '@/schemas/campaignSchema';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { formatDateTime12 } from '@/lib/date';
import { Button } from '@/components/ui/button';

// Step components
import CampaignSetup from './steps/CampaignSetup';
import ContactSelection from './steps/ContactSelection';
import TemplateSelection from './steps/TemplateSelection';
import CampaignPreview from './steps/CampaignPreview';
import { CotactType } from '@/types';

const STEPS = [
    { id: 1, title: 'Setup', description: 'Define name', icon: Settings2 },
    { id: 2, title: 'Audience', description: 'Select contacts', icon: Users },
    { id: 3, title: 'Content', description: 'Pick template', icon: MessageSquare },
    { id: 4, title: 'Launch', description: 'Review & Send', icon: Send },
];

type CampaignFormData = CreateCampaignWorkflowData;

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
        resolver: zodResolver(createCampaignWorkflowSchema),
        defaultValues: {
            name: '',
            projectId: selectedProject?._id || '',
            selectedContacts: [],
            templateName: '',
            sendType: 'now',
            scheduledAt: null,
        },
        mode: 'onChange',
    });

    useEffect(() => {
        if (selectedProject?._id) {
            setValue('projectId', selectedProject._id);
        }
    }, [selectedProject, setValue]);

    const watchedValues = watch();

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
        switch (currentStep) {
            case 1:
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
                isValid = true;
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

        const payload: CreateCampaignPayload = {
            name: data.name,
            projectId: selectedProject._id,
            selectedContacts: selectedContacts.map(contact => ({
                contactId: contact._id,
                phoneNumber: contact.phone,
            })),
            templateName: selectedTemplate!.name,
            variableMappings,
            sendType: data.sendType,
            scheduledAt: data.sendType === 'scheduled' ? data.scheduledAt : undefined,
            headerMediaAssetId: headerMediaAssetId || undefined,
            contactType: 'whatsapp',
        };

        if (contactType === 'wlh') {
            payload.selectedContacts = [];
            payload.contactType = 'wlh';
            payload.wlhAttendeeFilters = {
                filters: wlhAttendeeFilters.filters!,
                contactCount: wlhAttendeeFilters.contactCount,
                isAttended: wlhAttendeeFilters.isAttended!,
            };
        }

        try {
            await createCampaignMutation.mutateAsync(payload);
            toastUtils.success(data.sendType === 'scheduled' ? 'Campaign scheduled successfully!' : 'Campaign launched successfully!');
            navigate(`/whatsapp/dashboard/${projectId}/campaigns`);
        } catch (error) {
            console.error('Failed to create campaign:', error);
        }
    };

    const renderStep = () => {
        const variants = {
            enter: { opacity: 0, x: 20 },
            center: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -20 }
        };

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {currentStep === 1 && (
                        <CampaignSetup
                            register={register}
                            errors={errors}
                            onNext={handleNext}
                            watchedValues={watchedValues}
                        />
                    )}
                    {currentStep === 2 && (
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
                    )}
                    {currentStep === 3 && (
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
                    )}
                    {currentStep === 4 && (
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
                    )}
                </motion.div>
            </AnimatePresence>
        );
    };

    if (!selectedProject) {
        return (
            <div className="min-h-full flex items-center justify-center p-8 bg-white dark:bg-slate-800/50 shadow-sm">
                <Alert className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-800/50">
                    <AlertCircle className="h-8 w-8 mb-4 text-[#22B573]" />
                    <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">Project Required</AlertTitle>
                    <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
                        Please select a project from the sidebar to start building your campaign.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
            {/* Premium Header */}
            <motion.div
                className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/whatsapp/dashboard/${projectId}/campaigns`)}
                            className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all text-slate-500 dark:text-slate-400"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[#22B573] font-bold text-xs uppercase tracking-widest mb-0.5">
                                <Sparkles className="h-3.5 w-3.5" />
                                Campaign Architect
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                Create New Campaign
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                Design and deploy high-impact WhatsApp campaigns in minutes.
                            </p>
                        </div>
                    </div>

                    {/* Progress Badge */}
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl px-5 py-3">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Architecture Progress</p>
                            <p className="text-sm font-black text-[#22B573] leading-none">{Math.round((currentStep / STEPS.length) * 100)}% Complete</p>
                        </div>
                        <div className="h-10 w-10 rounded-full border-2 border-[#22B573] border-t-slate-200 flex items-center justify-center font-black text-xs text-[#22B573] bg-white dark:bg-slate-800/50 animate-spin-slow">
                            {currentStep}
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Sidebar Navigation / Progress */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="xl:col-span-1 space-y-6"
                >
                    <Card className="rounded-[24px] border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden sticky top-6">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Campaign Blueprint</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            <div className="relative space-y-2">
                                {/* Connecting line */}
                                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-100 dark:bg-slate-900/60" />
                                
                                {STEPS.map((step, index) => {
                                    const Icon = step.icon;
                                    const isActive = currentStep === step.id;
                                    const isCompleted = currentStep > step.id;
                                    
                                    return (
                                        <div 
                                            key={step.id}
                                            className={`relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                                                isActive ? 'bg-[#22B573]/5 border border-[#22B573]/10 shadow-sm' : 'border border-transparent'
                                            }`}
                                        >
                                            <div className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-500 ${
                                                isCompleted 
                                                    ? 'bg-[#22B573] text-white shadow-lg shadow-green-600/20' 
                                                    : isActive 
                                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
                                                        : 'bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700/50 text-slate-400'
                                            }`}>
                                                {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[11px] font-black uppercase tracking-widest leading-none mb-0.5 ${
                                                    isActive ? 'text-[#22B573]' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                                }`}>
                                                    {step.title}
                                                </p>
                                                <p className={`text-[10px] font-bold truncate leading-none ${
                                                    isActive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400'
                                                }`}>
                                                    {step.description}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="step-indicator"
                                                    className="absolute left-0 w-1 h-6 bg-[#22B573] rounded-full"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest mb-2">
                                        <Zap className="h-3.5 w-3.5" />
                                        Pro Tip
                                    </div>
                                    <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                                        Personalize your messages using variables to increase engagement by up to 40%.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Main Content Area */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="xl:col-span-3"
                >
                    <Card className="rounded-[32px] border-slate-200 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 bg-white dark:bg-slate-800/50">
                        <CardHeader className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-700/50 px-6 sm:px-10 py-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {STEPS[currentStep - 1].title}
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">
                                        {STEPS[currentStep - 1].description}
                                    </CardDescription>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-center text-[#22B573]">
                                    {(() => {
                                        const Icon = STEPS[currentStep - 1].icon;
                                        return <Icon className="h-7 w-7" />;
                                    })()}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 sm:px-10 py-10 min-h-[400px]">
                            {renderStep()}
                        </CardContent>
                    </Card>

                    {/* Footer Warning / Info */}
                    {createCampaignMutation.isError && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <Alert variant="destructive" className="rounded-2xl border-none shadow-lg bg-red-50 dark:bg-red-500/10">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <AlertTitle className="font-bold text-red-900">Deployment Failed</AlertTitle>
                                <AlertDescription className="text-red-700 font-medium text-sm">
                                    {(createCampaignMutation.error as any)?.response?.data?.message || 'We encountered an error while processing your request. Please check your data and try again.'}
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default CreateCampaign;
