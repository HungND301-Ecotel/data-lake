import React from "react";
import { useParams } from "react-router-dom";
import { TemplateForm } from "../components/TemplateForm";
import { MappingTable } from "../components/MappingTable";

export const TemplateDetail: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  if (!templateId) return <div>Template không tồn tại</div>;

  return (
    <div>
      <TemplateForm templateId={Number(templateId)} />
      <MappingTable templateId={Number(templateId)} />
    </div>
  );
};
