import React, { useState } from "react";
import { Add } from "@mui/icons-material";
import AppLoader from "../../../../components/AppLoader";
import tagsService from "../../../../services/tagsService";

const CreateWebhookForm = ({ webinarId, onCreateSuccess }) => {
  const [webhookName, setWebhookName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!webhookName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      const response = await tagsService.createWebinarWebhook({
        webinarId: webinarId,
        webhookName: webhookName,
        isActive: false,
      });
      if (response?.success) {
        setWebhookName("");
        if (onCreateSuccess) {
          onCreateSuccess();
        }
      }
    } catch (error) {
      console.error("Error creating webhook:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && webhookName.trim() && !isCreating) {
      handleCreate();
    }
  };

  return (
    <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">
        Create New Webhook
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Webhook Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={webhookName}
            onChange={(e) => setWebhookName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter webhook name"
            disabled={isCreating}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCreate}
            disabled={!webhookName.trim() || isCreating}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              !webhookName.trim() || isCreating
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
            type="button"
          >
            {isCreating ? (
              <>
                <AppLoader size="sm" variant="inverse" />
                Creating...
              </>
            ) : (
              <>
                <Add /> Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWebhookForm;

