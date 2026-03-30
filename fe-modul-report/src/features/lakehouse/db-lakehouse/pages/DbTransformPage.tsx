import { Alert, message } from "antd";
import { useDbPipeline } from "../hooks/useDbPipeline";
import { useDbStream } from "../hooks/useDbStream";
import SilverTransformForm from "../components/SilverTransformForm";
import GoldTransformForm from "../components/GoldTransformForm";
import PipelineProgress from "../components/PipelineProgress";
import type { SilverTransformRequest, GoldTransformRequest } from "../types/dbLakehouse";

export default function DbTransformPage() {
  const { error, databasesByLayer, fetchDatabases } = useDbPipeline();
  const silverStream = useDbStream();
  const goldStream = useDbStream();

  const handleSilver = async (values: SilverTransformRequest) => {
    await silverStream.silverTransformStream(values);
    await fetchDatabases();
    if (!silverStream.error) {
      message.success("Silver transform hoàn tất!");
    }
  };

  const handleGold = async (values: GoldTransformRequest) => {
    await goldStream.goldTransformStream(values);
    await fetchDatabases();
    if (!goldStream.error) {
      message.success("Gold transform hoàn tất!");
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <SilverTransformForm
        bronzeDatabases={databasesByLayer("bronze")}
        loading={silverStream.streaming}
        onSubmit={handleSilver}
      />

      <PipelineProgress
        progress={silverStream.progress}
        phase={silverStream.phase}
        message={silverStream.message}
        logs={silverStream.logs}
        streaming={silverStream.streaming}
        error={silverStream.error}
      />

      <GoldTransformForm
        silverDatabases={databasesByLayer("silver")}
        loading={goldStream.streaming}
        onSubmit={handleGold}
      />

      <PipelineProgress
        progress={goldStream.progress}
        phase={goldStream.phase}
        message={goldStream.message}
        logs={goldStream.logs}
        streaming={goldStream.streaming}
        error={goldStream.error}
      />
    </div>
  );
}
