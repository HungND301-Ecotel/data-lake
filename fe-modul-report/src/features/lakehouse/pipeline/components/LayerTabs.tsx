import { Tabs, Badge } from "antd";
import { FileOutlined, FileTextOutlined, FileSearchOutlined } from "@ant-design/icons";
import type { LayerType } from "../hooks/usePipeline";

interface Props {
  activeLayer: LayerType;
  onChange: (layer: LayerType) => void;
  rawCount: number;
  bronzeCount: number;
  silverCount: number;
}

export default function LayerTabs({ activeLayer, onChange, rawCount, bronzeCount, silverCount }: Props) {
  return (
    <Tabs
      activeKey={activeLayer}
      onChange={(key) => onChange(key as LayerType)}
      items={[
        {
          key: "raw",
          label: (
            <span className="flex items-center gap-2">
              <FileOutlined />
              Raw
              <Badge count={rawCount} showZero size="small" color="blue" />
            </span>
          ),
        },
        {
          key: "bronze",
          label: (
            <span className="flex items-center gap-2">
              <FileTextOutlined />
              Bronze (OCR)
              <Badge count={bronzeCount} showZero size="small" color="orange" />
            </span>
          ),
        },
        {
          key: "silver",
          label: (
            <span className="flex items-center gap-2">
              <FileSearchOutlined />
              Silver (Cấu trúc)
              <Badge count={silverCount} showZero size="small" color="green" />
            </span>
          ),
        },
      ]}
    />
  );
}
