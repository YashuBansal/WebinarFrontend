import { useState } from "react";
import { useProjectContext } from "@/context/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Trash2, Power, PowerOff, Image, CheckCircle2, XCircle } from "lucide-react";
import { useAutoMessageConfigs, useDeleteAutoMessageConfig, useToggleAutoMessageConfig } from "@/hooks/useAutoMessageConfigs";

export default function AutoMessageConfigsList() {
  const { selectedProject } = useProjectContext();
  const { data: configs = [], isLoading: loading } = useAutoMessageConfigs(selectedProject?._id);
  const { mutate: deleteConfig, isPending: deleting } = useDeleteAutoMessageConfig();
  const { mutate: toggleConfig, isPending: toggling } = useToggleAutoMessageConfig();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<typeof configs[0] | null>(null);

  const handleDeleteClick = (config: typeof configs[0]) => {
    setSelectedConfig(config);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedConfig || !selectedProject?._id) return;
    
    deleteConfig(
      { _id: selectedConfig.id, projectId: selectedProject._id },
      {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setSelectedConfig(null);
        },
      }
    );
  };

  const handleToggleClick = (config: typeof configs[0]) => {
    setSelectedConfig(config);
    setToggleModalOpen(true);
  };

  const handleToggleConfirm = () => {
    if (!selectedConfig || !selectedProject?._id) return;
    toggleConfig(
      {
        _id: selectedConfig.id,
        projectId: selectedProject._id,
        enabled: !selectedConfig.enabled,
      },
      {
        onSuccess: () => {
          setToggleModalOpen(false);
          setSelectedConfig(null);
        },
      }
    );
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading configurations...</div>;
  }

  if (!configs.length) {
    return <div className="text-sm text-muted-foreground">No auto message configurations yet.</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {configs.map((cfg) => {
          const anyCfg: any = cfg as any;
          const sent = (anyCfg && anyCfg.sent) ?? 0;
          const failed = (anyCfg && anyCfg.failed) ?? 0;
          
          return (
            <div 
              key={cfg.id} 
              className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Main Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-foreground">
                          {cfg.webinarName || cfg.webinarId}
                        </h3>
                        {!!cfg.headerMediaAssetId && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Has header media">
                            <Image className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Template: <span className="font-medium text-foreground">{cfg.templateName}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-muted-foreground">Sent:</span>
                      <span className="font-medium text-foreground">{sent}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-muted-foreground">Failed:</span>
                      <span className="font-medium text-foreground">{failed}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge 
                    variant={cfg.enabled ? 'default' : 'secondary'}
                    className={cfg.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                  >
                    {cfg.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {cfg.enabled ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleClick(cfg)}
                      disabled={toggling}
                      className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                      title="Disable"
                    >
                      <PowerOff className="h-4 w-4 mr-1" />
                      Disable
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleClick(cfg)}
                      disabled={toggling}
                      className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      title="Enable"
                    >
                      <Power className="h-4 w-4 mr-1" />
                      Enable
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(cfg)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmationDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Auto Message Configuration"
        description={`Are you sure you want to delete the configuration for "${selectedConfig?.webinarName || selectedConfig?.webinarId}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleting}
      />

      <ConfirmationDialog
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        onConfirm={handleToggleConfirm}
        title={selectedConfig?.enabled ? "Disable Auto Message Configuration" : "Enable Auto Message Configuration"}
        description={`Are you sure you want to ${selectedConfig?.enabled ? 'disable' : 'enable'} the auto message configuration for "${selectedConfig?.webinarName || selectedConfig?.webinarId}"?`}
        confirmText={selectedConfig?.enabled ? "Disable" : "Enable"}
        cancelText="Cancel"
        variant="default"
        isLoading={toggling}
      />
    </>
  );
}


