import { Alert } from "antd";
import { useDocumentChat } from "../hooks/useDocumentChat";
import DocumentChatWindow from "../components/DocumentChatWindow";

export default function DocumentChatPage() {
  const { messages, sessionId, documentName, loading, error, sendMessage, resetSession } = useDocumentChat();

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}
      <DocumentChatWindow
        messages={messages}
        loading={loading}
        sessionId={sessionId}
        documentName={documentName}
        onSend={sendMessage}
        onReset={resetSession}
      />
    </div>
  );
}
