import React, { useState, useEffect, useCallback } from "react";
import tagsService from "../../../services/tagsService";
import DialogHeader from "./components/DialogHeader";
import CreateWebhookForm from "./components/CreateWebhookForm";
import WebhookList from "./components/WebhookList";
import AppLoader from "../../../components/AppLoader";

const WebinarWebhooksListDialog = ({ webinarId, onClose, isOpen, onRefresh }) => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = useCallback(async () => {
    if (!webinarId) return;
    
    setLoading(true);
    try {
      const response = await tagsService.getWebinarWebhooks(webinarId);
      if (response?.success) {
        setWebhooks(response.data || []);
      } else {
        setWebhooks([]);
      }
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, [webinarId]);

  useEffect(() => {
    if (isOpen && webinarId) {
      fetchWebhooks();
    }
  }, [isOpen, webinarId, fetchWebhooks]);

  const handleCreateSuccess = useCallback(() => {
    fetchWebhooks();
    if (onRefresh) {
      onRefresh();
    }
  }, [fetchWebhooks, onRefresh]);

  const handleUpdate = useCallback(() => {
    fetchWebhooks();
    if (onRefresh) {
      onRefresh();
    }
  }, [fetchWebhooks, onRefresh]);

  const handleDelete = useCallback(() => {
    fetchWebhooks();
    if (onRefresh) {
      onRefresh();
    }
  }, [fetchWebhooks, onRefresh]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all">
        <DialogHeader
          title="Webinar Webhooks"
          description="Manage webhooks for this webinar."
          onClose={onClose}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <AppLoader size="lg" />
          </div>
        ) : (
          <>
            <CreateWebhookForm
              webinarId={webinarId}
              onCreateSuccess={handleCreateSuccess}
            />
            <WebhookList
              webhooks={webhooks}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </>
        )}

        <div className="flex justify-end mt-6 pt-6 border-t border-slate-200">
          <button
            className="px-6 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebinarWebhooksListDialog;