import { useCallback, useRef, useState } from "react";
import ingestionApi from "../api/ingestionApi";
import type { BronzeObject, IngestMetadata } from "../types/ingestion";

/** 8 MB parts - below the worker's MAX_UPLOAD_SIZE default of 50 MB. */
export const PART_SIZE = 8 * 1024 * 1024;

export type UploadPhase = "idle" | "hashing" | "uploading" | "completing" | "done" | "error";

export interface UploadState {
  phase: UploadPhase;
  /** 0-100 across hashing + part transfer */
  percent: number;
  uploadId: string | null;
  sentParts: number;
  totalParts: number;
  error: string | null;
  object: BronzeObject | null;
}

const INITIAL: UploadState = {
  phase: "idle",
  percent: 0,
  uploadId: null,
  sentParts: 0,
  totalParts: 0,
  error: null,
  object: null,
};

/**
 * SHA-256 over the whole file, computed in the browser so the worker can
 * verify end-to-end integrity on complete (doc KPI - ingest integrity).
 *
 * crypto.subtle only exists in a secure context (https or localhost). Over
 * plain http the checksum is skipped; the server still computes and stores
 * its own digest, it just cannot cross-check the client's copy.
 */
export async function hashFile(
  file: File,
  onProgress?: (fraction: number) => void
): Promise<string | undefined> {
  if (!globalThis.crypto?.subtle) return undefined;

  // Digest needs the whole buffer; stream it in to keep progress responsive.
  const buffers: ArrayBuffer[] = [];
  let read = 0;
  for (let offset = 0; offset < file.size; offset += PART_SIZE) {
    const slice = file.slice(offset, Math.min(offset + PART_SIZE, file.size));
    buffers.push(await slice.arrayBuffer());
    read += slice.size;
    onProgress?.(file.size ? read / file.size : 1);
  }
  const merged = new Uint8Array(file.size);
  let cursor = 0;
  for (const buffer of buffers) {
    merged.set(new Uint8Array(buffer), cursor);
    cursor += buffer.byteLength;
  }
  const digest = await crypto.subtle.digest("SHA-256", merged);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function useMultipartUpload() {
  const [state, setState] = useState<UploadState>(INITIAL);
  const abortedRef = useRef(false);

  const reset = useCallback(() => {
    abortedRef.current = false;
    setState(INITIAL);
  }, []);

  const abort = useCallback(async () => {
    abortedRef.current = true;
    const uploadId = state.uploadId;
    if (uploadId) {
      try {
        await ingestionApi.abortUpload(uploadId);
      } catch {
        // The session may already be closed; nothing further to do.
      }
    }
    setState((prev) => ({ ...prev, phase: "idle", uploadId: null }));
  }, [state.uploadId]);

  const upload = useCallback(
    async (file: File, metadata: IngestMetadata): Promise<BronzeObject | null> => {
      abortedRef.current = false;
      const totalParts = Math.max(1, Math.ceil(file.size / PART_SIZE));
      setState({ ...INITIAL, phase: "hashing", totalParts });

      try {
        // Hashing counts for the first 20% of the bar.
        const sha256 = await hashFile(file, (fraction) =>
          setState((prev) => ({ ...prev, percent: Math.round(fraction * 20) }))
        );
        if (abortedRef.current) return null;

        const session = await ingestionApi.createUpload({
          original_name: file.name,
          size_bytes: file.size,
          sha256,
          mime_type: file.type || undefined,
          total_parts: totalParts,
          ...metadata,
        });
        setState((prev) => ({
          ...prev,
          phase: "uploading",
          uploadId: session.upload_id,
        }));

        for (let index = 0; index < totalParts; index += 1) {
          if (abortedRef.current) return null;
          const slice = file.slice(
            index * PART_SIZE,
            Math.min((index + 1) * PART_SIZE, file.size)
          );
          await ingestionApi.uploadPart(session.upload_id, index + 1, slice);
          const sent = index + 1;
          setState((prev) => ({
            ...prev,
            sentParts: sent,
            percent: 20 + Math.round((sent / totalParts) * 75),
          }));
        }

        setState((prev) => ({ ...prev, phase: "completing", percent: 96 }));
        const object = await ingestionApi.completeUpload(session.upload_id);
        setState((prev) => ({ ...prev, phase: "done", percent: 100, object }));
        return object;
      } catch (error) {
        const messageText = error instanceof Error ? error.message : "Lỗi tải lên";
        setState((prev) => ({ ...prev, phase: "error", error: messageText }));
        return null;
      }
    },
    []
  );

  /**
   * Resume an interrupted session: ask the worker which parts it already has
   * and send only the rest (doc UC03.03).
   */
  const resume = useCallback(
    async (uploadId: string, file: File): Promise<BronzeObject | null> => {
      abortedRef.current = false;
      try {
        const session = await ingestionApi.getUpload(uploadId);
        const received = new Set(session.received_parts || []);
        const totalParts =
          session.total_parts || Math.max(1, Math.ceil(file.size / PART_SIZE));
        setState({
          ...INITIAL,
          phase: "uploading",
          uploadId,
          totalParts,
          sentParts: received.size,
          percent: 20 + Math.round((received.size / totalParts) * 75),
        });

        for (let index = 1; index <= totalParts; index += 1) {
          if (abortedRef.current) return null;
          if (received.has(index)) continue;
          const slice = file.slice(
            (index - 1) * PART_SIZE,
            Math.min(index * PART_SIZE, file.size)
          );
          await ingestionApi.uploadPart(uploadId, index, slice);
          received.add(index);
          setState((prev) => ({
            ...prev,
            sentParts: received.size,
            percent: 20 + Math.round((received.size / totalParts) * 75),
          }));
        }

        setState((prev) => ({ ...prev, phase: "completing", percent: 96 }));
        const object = await ingestionApi.completeUpload(uploadId);
        setState((prev) => ({ ...prev, phase: "done", percent: 100, object }));
        return object;
      } catch (error) {
        const messageText = error instanceof Error ? error.message : "Lỗi tiếp tục tải lên";
        setState((prev) => ({ ...prev, phase: "error", error: messageText }));
        return null;
      }
    },
    []
  );

  return { state, upload, resume, abort, reset };
}
