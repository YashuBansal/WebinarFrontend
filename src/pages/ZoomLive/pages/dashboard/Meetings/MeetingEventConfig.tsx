import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@zoom/components/ui/button';
import { Label } from '@zoom/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zoom/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@zoom/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@zoom/components/ui/popover';
import { Check, ChevronsUpDown, ArrowLeft, Save, Settings, UserX, MessageSquare, PlayCircle, RefreshCw } from 'lucide-react';
import {
  useMeetingEventConfig,
  useWhatsAppProjects,
  useConfiguredTemplates,
  useCreateMeetingEventConfig,
  useUpdateMeetingEventConfig
} from '@zoom/hooks/useMeetingEventConfig';
import type {
  MeetingEventConfigResponse,
  Project,
  CreateMeetingEventConfigPayload,
  UpdateMeetingEventConfigPayload
} from '@zoom/schemas/meetingEventConfig';
import { useWebinars } from '@zoom/hooks/useZoom';
import { motion } from 'framer-motion';
import { cn } from '@zoom/lib/utils';
// import { toastUtils } from '@zoom/lib/utils'; // TODO: Re-enable when validation is needed

// Event types from zoom-meeting schema
const EVENT_TYPES = [
  {
    key: 'meetingStarted',
    label: 'Meeting Started',
    description: 'Triggered when the meeting begins',
    icon: PlayCircle,
  },
  // TODO: Re-enable when delay logic is implemented
  // {
  //   key: 'nonAttendeeNudge',
  //   label: 'Non-Attendee Nudge',
  //   description: 'Reminder for participants who haven\'t joined',
  //   icon: Users,
  // },
  {
    key: 'participantLeft',
    label: 'Participant Left',
    description: 'Triggered when a participant leaves the meeting',
    icon: UserX,
  },
  {
    key: 'meetingEndedAttendees',
    label: 'Meeting Ended (Attendees)',
    description: 'Message sent to participants who attended',
    icon: MessageSquare,
  },
  {
    key: 'meetingEndedNonAttendees',
    label: 'Meeting Ended (Non-Attendees)',
    description: 'Message sent to participants who didn\'t attend',
    icon: MessageSquare,
  },
];

export default function MeetingEventConfig() {
  const { projectId, meetingId, webinarId } = useParams<{ projectId: string; meetingId?: string; webinarId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const occurrenceId = searchParams.get('occurrenceId') || undefined;

  // Determine if this is a webinar or meeting context
  const isWebinar = !!webinarId;
  const zoomId = webinarId || meetingId; // Use webinarId if present, otherwise meetingId

  // In this context, projectId is actually the zoomProjectId
  const zoomProjectId = projectId;

  // State for form data
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [eventConfigs, setEventConfigs] = useState<Record<string, {
    enabled: boolean;
    configuredTemplateId?: string;
  }>>({});

  // Fetch existing configuration
  const { data: existingConfig, isLoading: configLoading } = useMeetingEventConfig(
    zoomId!,
    occurrenceId,
  );

  // Fetch WhatsApp projects
  const { data: projects, isLoading: projectsLoading } = useWhatsAppProjects();

  // Fetch configured templates for selected project
  const { data: templates, isLoading: templatesLoading } = useConfiguredTemplates(selectedProject?._id || '');

  const { data: webinars } = useWebinars()

  // Mutations
  const createConfigMutation = useCreateMeetingEventConfig();
  const updateConfigMutation = useUpdateMeetingEventConfig();

  // Initialize form data when existing config is loaded
  useEffect(() => {
    if (existingConfig) {
      setSelectedProject({
        _id: existingConfig.whatsappProjectId,
        projectName: '', // Will be populated from projects list
        adminId: '',
        createdAt: '',
        updatedAt: '',
      });

      // Set event configurations with individual template IDs
      const configs: Record<string, {
        enabled: boolean;
        configuredTemplateId?: string;
      }> = {};
      EVENT_TYPES.forEach(event => {
        const eventConfig = existingConfig[event.key as keyof MeetingEventConfigResponse] as
          | { enabled: boolean; configuredTemplateId?: string }
          | string
          | undefined;
        if (typeof eventConfig === 'string' || !eventConfig) {
          configs[event.key] = {
            enabled: false,
            configuredTemplateId: '',
          };
        } else {
          configs[event.key] = {
            enabled: eventConfig.enabled,
            configuredTemplateId: eventConfig.configuredTemplateId,
          };
        }
      });
      setEventConfigs(configs);
    }
  }, [existingConfig]);

  // Update selected project when projects are loaded and we have an existing config
  useEffect(() => {
    if (projects && existingConfig && !selectedProject?.projectName) {
      const project = projects.find(p => p._id === existingConfig.whatsappProjectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [projects, existingConfig, selectedProject]);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    // Reset all event configurations when project changes
    setEventConfigs({});
  };

  const handleEventConfigChange = (eventKey: string, field: 'enabled' | 'configuredTemplateId', value: boolean | string) => {
    setEventConfigs(prev => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedProject || !zoomId) {
      return;
    }

    // TODO: Re-enable validation when Non-Attendee Nudge is re-enabled
    // // Validate Non-Attendee Nudge minimum delay
    // const nonAttendeeNudgeConfig = eventConfigs.nonAttendeeNudge;
    // if (nonAttendeeNudgeConfig?.enabled && nonAttendeeNudgeConfig.delayInMinutes < 1) {
    //   toastUtils.error('Non-Attendee Nudge must have a minimum delay of 1 minute when enabled.');
    //   return;
    // }

    // Find webinar ID if this is a webinar context
    // When occurrenceId exists, match by both meetingId and occurrenceId
    const internalWebinarId = occurrenceId
      ? (isWebinar
        ? webinars?.find((w: any) => w.meetingId === webinarId && w.occurrenceId === occurrenceId)?._id || undefined
        : webinars?.find((w: any) => w.meetingId === meetingId && w.occurrenceId === occurrenceId)?._id || undefined)
      : (isWebinar
        ? webinars?.find((w: any) => w.meetingId === webinarId)?._id || undefined
        : webinars?.find((w: any) => w.meetingId === meetingId)?._id || undefined);

    const payload = {
      meetingId: zoomId, // Use zoomId (which could be webinarId or meetingId)
      occurrenceId,
      whatsappProjectId: selectedProject._id,
      zoomProjectId: zoomProjectId!,
      webinarId: internalWebinarId,
      meetingStarted: {
        enabled: eventConfigs.meetingStarted?.enabled || false,
        delayInMinutes: 0, // TODO: Set actual delay when delay logic is implemented
        configuredTemplateId: eventConfigs.meetingStarted?.configuredTemplateId,
      },
      nonAttendeeNudge: {
        enabled: eventConfigs.nonAttendeeNudge?.enabled || false,
        delayInMinutes: 0, // TODO: Set actual delay when delay logic is implemented
        configuredTemplateId: eventConfigs.nonAttendeeNudge?.configuredTemplateId,
      },
      participantLeft: {
        enabled: eventConfigs.participantLeft?.enabled || false,
        delayInMinutes: 0, // TODO: Set actual delay when delay logic is implemented
        configuredTemplateId: eventConfigs.participantLeft?.configuredTemplateId,
      },
      meetingEndedAttendees: {
        enabled: eventConfigs.meetingEndedAttendees?.enabled || false,
        delayInMinutes: 0, // TODO: Set actual delay when delay logic is implemented
        configuredTemplateId: eventConfigs.meetingEndedAttendees?.configuredTemplateId,
      },
      meetingEndedNonAttendees: {
        enabled: eventConfigs.meetingEndedNonAttendees?.enabled || false,
        delayInMinutes: 0, // TODO: Set actual delay when delay logic is implemented
        configuredTemplateId: eventConfigs.meetingEndedNonAttendees?.configuredTemplateId,
      },
    };

    try {
      if (existingConfig) {
        await updateConfigMutation.mutateAsync({
          meetingId: zoomId,
          occurrenceId,
          payload: payload as UpdateMeetingEventConfigPayload,
        });
      } else {
        await createConfigMutation.mutateAsync(payload as CreateMeetingEventConfigPayload);
      }

      navigate(-1);
    } catch (error) {
      console.error('Failed to save meeting event configuration:', error);
    }
  };

  const canSave = selectedProject;
  const isLoading = createConfigMutation.isPending || updateConfigMutation.isPending;

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
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
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">
                <Settings className="h-3.5 w-3.5" />
                Event Automation
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {isWebinar ? 'Webinar' : 'Meeting'} Configuration
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Configure WhatsApp notifications and automation triggers for your {isWebinar ? 'webinar' : 'meeting'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={!canSave || isLoading}
              className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/10"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-8 pb-12">
        {/* Project Selection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[24px] p-6 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notification Project</h3>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Select the WhatsApp project for message delivery</p>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-14 justify-between px-4 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 transition-all text-sm font-bold"
                disabled={projectsLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-slate-400" />
                  </div>
                  {selectedProject ? selectedProject.projectName : 'Choose a WhatsApp Project...'}
                </div>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 rounded-2xl border-slate-200 dark:border-slate-700 shadow-2xl" align="start">
              <Command className="rounded-xl overflow-hidden">
                <CommandList>
                  <CommandEmpty className="p-4 text-center text-sm text-slate-500 font-bold">No projects found</CommandEmpty>
                  <CommandGroup>
                    {projects?.map((project) => (
                      <CommandItem
                        key={project._id}
                        onSelect={() => handleProjectSelect(project)}
                        className="rounded-lg py-3 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-3 h-4 w-4 text-blue-600",
                            selectedProject?._id === project._id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{project.projectName}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* Triggers Grid */}
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Automation Triggers</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {EVENT_TYPES.map((event, index) => {
                const Icon = event.icon;
                const config = eventConfigs[event.key] || {
                  enabled: false,
                  configuredTemplateId: ''
                };
                const selectedTemplate = templates?.find(t => t._id === config.configuredTemplateId);

                return (
                  <motion.div
                    key={event.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (index * 0.05) }}
                    className={cn(
                      "group relative bg-white dark:bg-slate-800/50 border rounded-[28px] p-6 transition-all duration-300",
                      config.enabled
                        ? "border-blue-400/50 dark:border-blue-500/50 shadow-xl shadow-blue-600/5"
                        : "border-slate-200 dark:border-slate-700/50 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                          config.enabled ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{event.label}</h4>
                          <p className="text-slate-500 text-xs font-medium mt-0.5 line-clamp-1">{event.description}</p>
                        </div>
                      </div>

                      <div
                        onClick={() => handleEventConfigChange(event.key, 'enabled', !config.enabled)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300",
                          config.enabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm",
                          config.enabled ? "translate-x-6" : "translate-x-0"
                        )} />
                      </div>
                    </div>

                    <div className={cn(
                      "space-y-4 transition-all duration-500 overflow-hidden",
                      config.enabled ? "max-h-60 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    )}>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">WhatsApp Template</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-11 justify-between px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold"
                              disabled={templatesLoading}
                            >
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                                {selectedTemplate ? selectedTemplate.configuredTemplateName : 'Choose a template...'}
                              </div>
                              <ChevronsUpDown className="h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-2 rounded-xl border-slate-200 dark:border-slate-700 shadow-xl" align="start">
                            <Command className="rounded-lg">
                              <CommandList className="max-h-[200px]">
                                <CommandEmpty className="p-4 text-xs text-slate-500 text-center font-bold">No templates found</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => handleEventConfigChange(event.key, 'configuredTemplateId', '')}
                                    className="rounded-lg py-2.5 cursor-pointer"
                                  >
                                    <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600", !config.configuredTemplateId ? 'opacity-100' : 'opacity-0')} />
                                    <span className="font-bold text-xs">No template</span>
                                  </CommandItem>
                                  {templates?.map((template) => (
                                    <CommandItem
                                      key={template._id}
                                      onSelect={() => handleEventConfigChange(event.key, 'configuredTemplateId', template._id)}
                                      className="rounded-lg py-2.5 cursor-pointer"
                                    >
                                      <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600", config.configuredTemplateId === template._id ? 'opacity-100' : 'opacity-0')} />
                                      <div className="flex flex-col">
                                        <span className="font-black text-xs text-slate-700 dark:text-slate-200">{template.configuredTemplateName}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Source: {template.templateName}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

