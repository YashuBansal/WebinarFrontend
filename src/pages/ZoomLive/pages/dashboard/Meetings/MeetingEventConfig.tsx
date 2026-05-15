import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@zoom/components/ui/button';
import { Label } from '@zoom/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zoom/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@zoom/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@zoom/components/ui/popover';
import { Check, ChevronsUpDown, ArrowLeft, Save, Settings, UserX, MessageSquare, PlayCircle } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isWebinar ? 'Webinar' : 'Meeting'} Event Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure WhatsApp notifications for {isWebinar ? 'webinar' : 'meeting'} events
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            navigate(-1);
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {isWebinar ? 'Webinar' : 'Meeting'}
        </Button>
      </div>
      
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            WhatsApp Project
          </CardTitle>
          <CardDescription>
            Select the WhatsApp project to use for notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                disabled={projectsLoading}
              >
                {selectedProject ? selectedProject.projectName : 'Select project...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>No projects found.</CommandEmpty>
                  <CommandGroup>
                    {projects?.map((project) => (
                      <CommandItem
                        key={project._id}
                        value={project._id}
                        onSelect={() => handleProjectSelect(project)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedProject?._id === project._id ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        {project.projectName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
      
      {/* Event Configurations */}
      {selectedProject && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Event Configurations</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {EVENT_TYPES.map((event) => {
              const Icon = event.icon;
              const config = eventConfigs[event.key] || { 
                enabled: false, 
                configuredTemplateId: ''
              };
              const selectedTemplate = templates?.find(t => t._id === config.configuredTemplateId);
              
              return (
                <Card key={event.key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4" />
                      {event.label}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {event.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${event.key}-enabled`}
                        checked={config.enabled}
                        onChange={(e) => handleEventConfigChange(event.key, 'enabled', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`${event.key}-enabled`} className="text-sm">
                        Enable this event
                      </Label>
                    </div>
                    
                    {config.enabled && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm">Configured Template (Optional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between"
                                disabled={templatesLoading}
                              >
                                {selectedTemplate ? selectedTemplate.configuredTemplateName : 'Select template...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandList>
                                  <CommandEmpty>No templates found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="none"
                                      onSelect={() => handleEventConfigChange(event.key, 'configuredTemplateId', '')}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          !config.configuredTemplateId ? 'opacity-100' : 'opacity-0'
                                        }`}
                                      />
                                      No template
                                    </CommandItem>
                                    {templates?.map((template) => (
                                      <CommandItem
                                        key={template._id}
                                        value={template._id}
                                        onSelect={() => handleEventConfigChange(event.key, 'configuredTemplateId', template._id)}
                                        className="cursor-pointer"
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            config.configuredTemplateId === template._id ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{template.configuredTemplateName}</span>
                                          <span className="text-xs text-muted-foreground">
                                            Based on: {template.templateName}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {/* TODO: Re-enable when delay logic is implemented
                        <div className="space-y-2">
                          <Label htmlFor={`${event.key}-delay`} className="text-sm">
                            Delay (minutes)
                          </Label>
                          <Input
                            id={`${event.key}-delay`}
                            type="number"
                            min={event.key === 'nonAttendeeNudge' ? "1" : "0"}
                            max="60"
                            value={config.delayInMinutes}
                            onChange={(e) => handleEventConfigChange(event.key, 'delayInMinutes', parseInt(e.target.value) || (event.key === 'nonAttendeeNudge' ? 1 : 0))}
                            placeholder={event.key === 'nonAttendeeNudge' ? "1" : "0"}
                          />
                          <p className="text-xs text-gray-500">
                            {event.key === 'nonAttendeeNudge' 
                              ? 'Delay before sending the notification (1-60 minutes)' 
                              : 'Delay before sending the notification (0-60 minutes)'
                            }
                          </p>
                        </div>
                        */}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!canSave || isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
