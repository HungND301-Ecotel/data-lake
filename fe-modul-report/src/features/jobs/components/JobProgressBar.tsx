import { Progress, Typography } from "antd";
import type { JobStatus } from "../types/job";

const { Text } = Typography;

interface Props {
  job: JobStatus;
}

export default function JobProgressBar({ job }: Props) {
  const status = job.status === "failed" ? "exception" : job.status === "completed" ? "success" : "active";

  return (
    <div>
      <Progress
        percent={Math.round(job.percentage)}
        status={status}
        size="small"
      />
      {job.current_stage && (
        <Text type="secondary" className="text-xs">
          {job.current_stage} ({job.stages_completed}/{job.total_stages})
        </Text>
      )}
    </div>
  );
}
