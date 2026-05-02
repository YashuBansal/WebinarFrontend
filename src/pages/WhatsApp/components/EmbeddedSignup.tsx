import WhatsAppConnect from "@/hooks/WhatsAppConnect";

const EmbeddedSignup: React.FC<any> = ({
  onConnectionSuccess,
  onConnectionFailure,
  projectId,
  isActive = true
}) => {
  return (
    <div className="space-y-4">
      {/* ... (rest of your JSX is fine and does not need changes) ... */}

      <WhatsAppConnect
        projectId={projectId}
        isActive={isActive}
        onConnectionSuccess={() => onConnectionSuccess?.()}
        onConnectionFailure={(error: string) => onConnectionFailure?.(error)}
      />
    </div>
  );
};

export default EmbeddedSignup;
