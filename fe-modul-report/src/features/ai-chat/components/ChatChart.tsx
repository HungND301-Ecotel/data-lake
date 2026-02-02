import { Column, Line, Pie } from "@ant-design/charts";
import { Typography, Empty } from "antd";
import type { ChatChartData } from "../types/chat";

const { Text } = Typography;

interface ChatChartProps {
  chart: ChatChartData;
}

const ChatChart: React.FC<ChatChartProps> = ({ chart }) => {
  if (!chart.chart_json?.data?.length) {
    return <Empty description="Không có dữ liệu biểu đồ" />;
  }

  const trace = chart.chart_json.data[0];
  const chartType = trace.type || "bar";

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      {chart.title && (
        <Text strong className="block mb-2">
          {chart.title}
        </Text>
      )}
      {renderChart(chartType, trace)}
    </div>
  );
};

function renderChart(
  chartType: string,
  trace: ChatChartData["chart_json"] extends { data: (infer T)[] } ? T : never
) {
  switch (chartType) {
    case "bar": {
      const data = (trace.x || []).map((x: string | number, i: number) => ({
        category: String(x),
        value: Number((trace.y || [])[i]) || 0,
      }));
      return (
        <Column
          data={data}
          xField="category"
          yField="value"
          height={300}
          color="#1677ff"
          label={{ position: "middle" as const }}
        />
      );
    }

    case "line":
    case "scatter": {
      const data = (trace.x || []).map((x: string | number, i: number) => ({
        category: String(x),
        value: Number((trace.y || [])[i]) || 0,
      }));
      return (
        <Line
          data={data}
          xField="category"
          yField="value"
          height={300}
          color="#1677ff"
          point={{ size: 4, shape: "circle" }}
          smooth
        />
      );
    }

    case "pie": {
      const data = (trace.labels || []).map(
        (label: string, i: number) => ({
          type: String(label),
          value: Number((trace.values || [])[i]) || 0,
        })
      );
      return (
        <Pie
          data={data}
          angleField="value"
          colorField="type"
          height={300}
          innerRadius={0.4}
          label={{ type: "outer" }}
        />
      );
    }

    default: {
      const data = (trace.x || []).map((x: string | number, i: number) => ({
        category: String(x),
        value: Number((trace.y || [])[i]) || 0,
      }));
      return (
        <Column
          data={data}
          xField="category"
          yField="value"
          height={300}
          color="#1677ff"
        />
      );
    }
  }
}

export default ChatChart;
