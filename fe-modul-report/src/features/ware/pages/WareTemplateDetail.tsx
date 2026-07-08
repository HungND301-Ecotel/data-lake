import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { TemplateForm } from "../components/TemplateForm";
import { MappingTable } from "../components/MappingTable";

export const TemplateDetail: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [reloadTrigger, setReloadTrigger] = useState(0);

  if (!templateId) return <div>Template không tồn tại</div>;

  return (
    <div className="min-h-screen">
      <TemplateForm templateId={Number(templateId)} reloadTrigger={reloadTrigger} />
      <MappingTable
        templateId={Number(templateId)}
        onSyncSuccess={() => setReloadTrigger((prev) => prev + 1)}
      />
    </div>
  );
};
