import { Card, Empty, Spin } from "antd";
import { lazy, Suspense } from "react";
import type { PlotlyChart } from "../types/dbLakehouse";

const Plot = lazy(() => import("react-plotly.js"));

interface PlotlyChartViewProps {
  chart: PlotlyChart | null;
  height?: number;
}

export default function PlotlyChartView({ chart, height = 400 }: PlotlyChartViewProps) {
  if (!chart) return <Empty description="Không có biểu đồ" />;

  return (
    <Card size="small">
      <Suspense fallback={<Spin tip="Đang tải biểu đồ..." className="w-full flex justify-center py-8" />}>
        <Plot
          data={chart.data as any[]}
          layout={{
            ...chart.layout,
            autosize: true,
            height,
          }}
          style={{ width: "100%" }}
          config={{ responsive: true, displayModeBar: true }}
          useResizeHandler
        />
      </Suspense>
    </Card>
  );
}
