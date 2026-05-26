import { supabase } from "../utils/supabaseClient";
import { getApiBaseUrl } from "../config/env";

function safeUploadError(error, fallback = "Upload failed.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || error.error_description || error.error || fallback;
}

async function createSignedUpload({ file, userId, subjectId, bucket }) {
  const response = await fetch(`${getApiBaseUrl()}/api/ai/storage/create-signed-upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      bucket,
      fileName: file.name,
      userId,
      subjectId
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Could not create signed upload URL (${response.status}).`);
  }

  return payload.upload;
}

async function uploadToSignedUrl({ file, bucket, filePath, token, onProgress }) {
  if (onProgress) onProgress(10);

  const { data, error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(filePath, token, file, {
      contentType: file.type || "application/octet-stream"
    });

  if (error) {
    throw new Error(safeUploadError(error));
  }

  if (onProgress) onProgress(100);

  return data;
}

export async function uploadLectureFile({
  file,
  userId,
  subjectId,
  bucket = "lecture-files",
  onProgress
}) {
  if (!file) {
    throw new Error("No file selected.");
  }

  if (!userId) {
    throw new Error("Missing userId.");
  }

  if (!subjectId) {
    throw new Error("Missing subjectId.");
  }

  if (onProgress) onProgress(3);

  const signedUpload = await createSignedUpload({
    file,
    userId,
    subjectId,
    bucket
  });

  await uploadToSignedUrl({
    file,
    bucket: signedUpload.bucket || bucket,
    filePath: signedUpload.filePath || signedUpload.path,
    token: signedUpload.token,
    onProgress
  });

  return {
    bucket: signedUpload.bucket || bucket,
    filePath: signedUpload.filePath || signedUpload.path,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size
  };
}
