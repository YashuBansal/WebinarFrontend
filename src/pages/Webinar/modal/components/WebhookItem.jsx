import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ContentCopy,
  Delete,
  Settings,
} from "@mui/icons-material";
import { copyToClipboard } from "../../../../utils/extra";
import tagsService from "../../../../services/tagsService";

const WebhookItem = ({ webhook, onUpdate, onDelete }) => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSetup = () => {
    navigate(`/webinar-webhook/setup/${webhook._id}`);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this webhook?")) {
      try {
        const response = await tagsService.deleteWebinarWebhook(webhook._id);
        if (response?.success && onDelete) {
          onDelete();
        }
      } catch (error) {
        console.error("Error deleting webhook:", error);
      }
    }
  };

  const handleToggleActive = async () => {
    setIsUpdating(true);
    try {
      const response = await tagsService.updateWebinarWebhook(webhook._id, {
        isActive: !webhook.isActive,
      });
      if (response?.success && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating webhook:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-slate-800">
              {webhook.webhookName || "Unnamed Webhook"}
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                webhook.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {webhook.isActive ? "Active" : "Inactive"}
            </span>
            {webhook.isResponseCaptured && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                Response Captured
              </span>
            )}
          </div>
          {webhook.webhookUrl ? (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-600 break-all">
                {webhook.webhookUrl}
              </span>
              <button
                onClick={() => copyToClipboard(webhook.webhookUrl, "URL")}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy URL"
                type="button"
              >
                <ContentCopy className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No URL configured</p>
          )}
        </div>
        <div className="flex gap-2 ml-4 flex-shrink-0">
          <button
            onClick={handleToggleActive}
            disabled={isUpdating}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              webhook.isActive
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
            type="button"
          >
            {webhook.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={handleSetup}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <Settings className="w-4 h-4" /> Setup
          </button>
          <button
            onClick={handleDelete}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <Delete className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebhookItem;

