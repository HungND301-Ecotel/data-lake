import { Row, Col, Alert } from "antd";
import { useRagChat, useRagSearch, useRagIngest } from "../hooks/useRagChat";
import { usePipeline } from "../../pipeline/hooks/usePipeline";
import RagChatWindow from "../components/RagChatWindow";
import SearchPanel from "../components/SearchPanel";
import IngestButton from "../components/IngestButton";

export default function RagPage() {
  const { messages, loading: chatLoading, error, sendMessage, clearMessages } = useRagChat();
  const { results, loading: searchLoading, search } = useRagSearch();
  const { loading: ingestLoading, ingest } = useRagIngest();
  const { rawFiles } = usePipeline();

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <div className="space-y-4">
            <IngestButton rawFiles={rawFiles} loading={ingestLoading} onIngest={ingest} />
            <SearchPanel results={results} loading={searchLoading} onSearch={search} />
          </div>
        </Col>
        <Col xs={24} lg={16}>
          <RagChatWindow
            messages={messages}
            loading={chatLoading}
            onSend={sendMessage}
            onClear={clearMessages}
          />
        </Col>
      </Row>
    </div>
  );
}
