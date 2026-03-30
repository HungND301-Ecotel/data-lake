import { useState, useCallback, useRef } from "react";
import { dbLakehouseApi } from "../api/dbLakehouseApi";
import type {
  SSEEvent,
  StreamLog,
  PipelinePhase,
  SilverTransformRequest,
  GoldTransformRequest,
  RemoteImportRequest,
} from "../types/dbLakehouse";

function getPhaseFromEvent(event: SSEEvent): PipelinePhase {
  const e = event.event;
  if (e.startsWith("bronze") || e === "start" && event.step === "bronze") return "bronze";
  if (e.startsWith("silver") || e === "start" && event.step === "silver") return "silver";
  if (e.startsWith("gold") || e === "start" && event.step === "gold") return "gold";
  if (e === "pipeline_complete" || e === "complete") return "complete";
  if (e === "pipeline_error" || e === "error" || e === "table_error") return "error";
  return event.pipeline_step || "bronze";
}

export function useDbStream() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<StreamLog[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completeData, setCompleteData] = useState<SSEEvent | null>(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    setProgress(0);
    setPhase("idle");
    setMessage("");
    setLogs([]);
    setError(null);
    setCompleteData(null);
    abortRef.current = false;
  }, []);

  const handleEvent = useCallback((event: SSEEvent) => {
    const currentProgress = event.overall_progress ?? event.progress ?? 0;
    const currentPhase = getPhaseFromEvent(event);
    const msg = event.message || "";

    setProgress(currentProgress);
    setPhase(currentPhase);
    if (msg) setMessage(msg);

    const log: StreamLog = {
      event: event.event,
      message: msg || `${event.event}${event.table ? ` - ${event.table}` : ""}`,
      progress: currentProgress,
      phase: currentPhase,
      timestamp: new Date().toISOString(),
      data: event,
    };
    setLogs((prev) => [...prev, log]);

    if (event.event === "pipeline_complete" || event.event === "complete") {
      setCompleteData(event);
    }

    if (event.event === "error" || event.event === "pipeline_error") {
      setError(event.message || "Lỗi xử lý pipeline");
    }
  }, []);

  const bronzeUploadStream = useCallback(async (file: File, databaseName?: string) => {
    reset();
    setStreaming(true);
    setPhase("bronze");
    try {
      await dbLakehouseApi.bronzeUploadStream(file, handleEvent, undefined, databaseName);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi stream Bronze upload");
      setPhase("error");
    } finally {
      setStreaming(false);
    }
  }, [handleEvent, reset]);

  const silverTransformStream = useCallback(async (body: SilverTransformRequest) => {
    reset();
    setStreaming(true);
    setPhase("silver");
    try {
      await dbLakehouseApi.silverTransformStream(body, handleEvent);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi stream Silver transform");
      setPhase("error");
    } finally {
      setStreaming(false);
    }
  }, [handleEvent, reset]);

  const goldTransformStream = useCallback(async (body: GoldTransformRequest) => {
    reset();
    setStreaming(true);
    setPhase("gold");
    try {
      await dbLakehouseApi.goldTransformStream(body, handleEvent);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi stream Gold transform");
      setPhase("error");
    } finally {
      setStreaming(false);
    }
  }, [handleEvent, reset]);

  const pipelineUploadStream = useCallback(async (
    file: File,
    options?: { autoClean?: boolean; autoStandardize?: boolean },
  ) => {
    reset();
    setStreaming(true);
    setPhase("bronze");
    try {
      await dbLakehouseApi.pipelineUploadStream(file, handleEvent, options);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi stream pipeline");
      setPhase("error");
    } finally {
      setStreaming(false);
    }
  }, [handleEvent, reset]);

  const remoteImportStream = useCallback(async (body: RemoteImportRequest) => {
    reset();
    setStreaming(true);
    setPhase("bronze");
    try {
      await dbLakehouseApi.remoteImportStream(body, handleEvent);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi stream remote import");
      setPhase("error");
    } finally {
      setStreaming(false);
    }
  }, [handleEvent, reset]);

  return {
    progress,
    phase,
    message,
    logs,
    streaming,
    error,
    completeData,
    reset,
    bronzeUploadStream,
    silverTransformStream,
    goldTransformStream,
    pipelineUploadStream,
    remoteImportStream,
  };
}
