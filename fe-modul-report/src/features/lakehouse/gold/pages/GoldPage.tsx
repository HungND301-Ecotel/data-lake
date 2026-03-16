import { Row, Col, Card, Alert, message } from "antd";
import { useGold } from "../hooks/useGold";
import { usePipeline } from "../../pipeline/hooks/usePipeline";
import GoldExtractionForm from "../components/GoldExtractionForm";
import GoldReviewTable from "../components/GoldReviewTable";
import PromptTemplateList from "../components/PromptTemplateList";

export default function GoldPage() {
  const { records, prompts, loading, error, extract, confirm, savePrompt, getDownloadUrl } = useGold();
  const { rawFiles } = usePipeline();

  const handleExtract = async (fileId: string, prompt: string, columns: string[]) => {
    const result = await extract({ file_id: fileId, prompt, columns_to_extract: columns });
    if (result.success) {
      message.success("Trích xuất Gold thành công!");
    } else {
      message.error(result.error);
    }
  };

  const handleConfirm = async (goldId: string) => {
    const result = await confirm(goldId);
    if (result.success) {
      message.success("Đã xác nhận gold data");
    } else {
      message.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Trích xuất Gold Layer" size="small">
            <GoldExtractionForm
              rawFiles={rawFiles}
              prompts={prompts}
              loading={loading}
              onExtract={handleExtract}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <PromptTemplateList prompts={prompts} onSave={savePrompt} />
        </Col>
      </Row>

      <Card title="Gold Records" size="small">
        <GoldReviewTable
          records={records}
          loading={loading}
          onConfirm={handleConfirm}
          getDownloadUrl={getDownloadUrl}
        />
      </Card>
    </div>
  );
}
