import { Card, Statistic, Typography } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

const { Text } = Typography;

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}) => {
  const changeColor =
    changeType === "positive"
      ? "#52c41a"
      : changeType === "negative"
        ? "#ff4d4f"
        : "#8c8c8c";

  const ChangeIcon =
    changeType === "positive"
      ? ArrowUpOutlined
      : changeType === "negative"
        ? ArrowDownOutlined
        : null;

  return (
    <Card hoverable bodyStyle={{ padding: 20 }}>
      <div className="flex items-start justify-between">
        <Statistic title={title} value={value} prefix={icon} />
      </div>
      {change && (
        <div className="mt-2">
          <Text style={{ color: changeColor, fontSize: 12 }}>
            {ChangeIcon && <ChangeIcon style={{ marginRight: 4 }} />}
            {change}
          </Text>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;
