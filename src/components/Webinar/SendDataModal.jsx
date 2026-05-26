import React, { useState, useEffect } from "react";
import { X, Send, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import AppLoader from "../AppLoader";
import { Dialog, DialogContent } from "../ui/dialog";
import { useTheme } from "../../contexts/ThemeContext";
import { instance as axiosInstance } from "../../services/axiosInterceptor";
import { errorToast } from "../../utils/extra";

const FONT = "Inter, sans-serif";

const INTEGRATION_LABELS = {
  convertkit: "ConvertKit",
  aweber: "AWeber",
  activecampaign: "ActiveCampaign",
  pabblyEmail: "Pabbly Email",
};

const SendDataModal = ({ onClose, onSubmit, isLoading }) => {
  const [activeIntegrations, setActiveIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [tag, setTag] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const fetchSettings = async () => {
      setIsFetching(true);
      try {
        const response = await axiosInstance.get("/integrations/settings");
        const settings = response?.data;
        if (settings) {
          const list = [];
          if (settings.convertkit?.isActive) list.push({ key: "convertkit", label: INTEGRATION_LABELS.convertkit });
          if (settings.aweber?.isActive) list.push({ key: "aweber", label: INTEGRATION_LABELS.aweber });
          if (settings.activecampaign?.isActive) list.push({ key: "activecampaign", label: INTEGRATION_LABELS.activecampaign });
          if (settings.pabblyEmail?.isActive) list.push({ key: "pabblyEmail", label: INTEGRATION_LABELS.pabblyEmail });
          
          setActiveIntegrations(list);
          if (list.length > 0) {
            setSelectedIntegration(list[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching integrations settings:", error);
        errorToast("Failed to fetch integrations settings.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSend = () => {
    if (selectedIntegration) {
      onSubmit(selectedIntegration.key, tag);
    }
  };

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";

  const cancelBtn = {
    backgroundColor: "transparent",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
  };
  
  const sendBtn = {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    boxShadow: "0 4px 10px rgba(59, 130, 246, 0.25)",
  };

  const labelStyle = {
    fontFamily: FONT,
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: isDark ? "#94a3b8" : "#64748b",
    marginBottom: "4px",
    display: "block",
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[450px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: FONT, color: titleColor }}>
              <Send className="w-5 h-5 text-blue-500 shrink-0" />
              Send Data to Integrations
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <span style={labelStyle}>Select Active Integration</span>
            {isFetching ? (
              <div className="flex justify-center py-6">
                <AppLoader size="md" />
              </div>
            ) : (
              <div className="space-y-4">
                {activeIntegrations.length === 0 ? (
                  <div className="rounded-xl p-4 text-center border bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm border-yellow-200 dark:border-yellow-500/20">
                    No active integrations configured. Please go to Integration Settings to activate one.
                  </div>
                ) : (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex h-12 w-full items-center justify-between rounded-xl border-gray-200 bg-white px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <span className="truncate">
                            {selectedIntegration ? selectedIntegration.label : "Select integration..."}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[250px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                      >
                        {activeIntegrations.map((item) => (
                          <DropdownMenuItem
                            key={item.key}
                            onClick={() => setSelectedIntegration(item)}
                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                          >
                            {item.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Tag Selection Field */}
                    <div className="space-y-1.5 pt-2">
                      <span style={labelStyle}>Apply Tag (Optional)</span>
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="e.g. Webinar_Attendee"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-all"
                      />
                    </div>
                  </>
                )}
                <p className="text-xs text-gray-500 italic">
                  Note: This will securely push selected attendee profile data directly into the chosen system.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex justify-end items-center gap-2">
              <Button onClick={onClose} style={cancelBtn} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading || !selectedIntegration}
                style={sendBtn}
                className="rounded-xl h-10 px-8 font-bold transition-all hover:scale-105 min-w-[120px]"
              >
                {isLoading ? <AppLoader size="sm" variant="inverse" /> : "Send Data"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendDataModal;
