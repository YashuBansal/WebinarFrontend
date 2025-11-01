import React from "react";
import WebhookItem from "./WebhookItem";

const WebhookList = ({ webhooks, onUpdate, onDelete }) => {
  if (webhooks.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p className="text-lg">No webhooks found</p>
        <p className="text-sm mt-2">Create your first webhook above</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <WebhookItem
          key={webhook._id}
          webhook={webhook}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default WebhookList;

