import { supabase } from "../utils/supabaseClient";
import { getApiBaseUrl } from "../config/env";

function makeDebug(onDebugStep, code, message, status = "ok") {
  if (typeof onDebugStep === "function") {
    onDebugStep(code, message, status);
  }
}

async function parseJsonResponse(response, stageCode) {
  const rawText = await response.text();
  let payload = null;

  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch (jsonError) {
    throw new Error(`[${stageCode}_INVALID_JSON] Backend returned non-JSON response: ${rawText.slice(0, 160)}`);
  }

  if (!response.ok || !payload?.success) {
    const backendCode = payload?.code ? `${stageCode}_${payload.code}` : `${stageCode}_SERVER_ERROR`;
    throw new Error(`[${backendCode}] ${payload?.error || `Request failed with status ${response.status}.`}`);
  }

  return payload;
}

async function createSignedUpload({ file, userId, subjectId, bucket, onDebugStep }) {
  makeDebug(onDebugStep, "UP-010_CREATE_SIGNED_URL_START", "Requesting signed upload URL.");

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/ai/storage/create-signed-upload`, {
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
  } catch (networkError) {
    throw new Error(`[UP-011_CREATE_SIGNED_URL_NETWORK] ${networkError.message || "Could not reach Render backend."}`);
  }

  const payload = await parseJsonResponse(response, "UP-012_CREATE_SIGNED_URL");

  if (!payload.upload?.token || !payload.upload?.filePath) {
    throw new Error("[UP-013_CREATE_SIGNED_URL_BAD_PAYLOAD] Backend did not return signed upload token and file path.");
  }

  makeDebug(onDebugStep, "UP-014_CREATE_SIGNED_URL_DONE", "Signed upload URL created.");

  return payload.upload;
}

async function uploadToSignedUrl({ file, bucket, filePath, token, onProgress, onDebugStep }) {
  makeDebug(onDebugStep, "UP-020_UPLOAD_TO_SUPABASE_START", "Uploading file to Supabase Storage.");
  if (onProgress) onProgress(10);

  const { data, error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(filePath, token, file, {
      contentType: file.type || "application/octet-stream"
    });

  if (error) {
    throw new Error(`[UP-021_UPLOAD_TO_SUPABASE_FAILED] ${error.message || error.error_description || error.error || "Supabase upload failed."}`);
  }

  if (onProgress) onProgress(100);
  makeDebug(onDebugStep, "UP-022_UPLOAD_TO_SUPABASE_DONE", "File uploaded to Supabase Storage.");

  return data;
}

export async function uploadLectureFile({
  file,
  userId,
  subjectId,
  bucket = "lecture-files",
  onProgress,
  onDebugStep
}) {
  if (!file) {
    throw new Error("[UP-001_NO_FILE] No file selected.");
  }

  if (!userId) {
    throw new Error("[UP-002_NO_USER] Missing userId.");
  }

  if (!subjectId) {
    throw new Error("[UP-003_NO_SUBJECT] Missing subjectId.");
  }

  if (onProgress) onProgress(3);

  const signedUpload = await createSignedUpload({
    file,
    userId,
    subjectId,
    bucket,
    onDebugStep
  });

  await uploadToSignedUrl({
    file,
    bucket: signedUpload.bucket || bucket,
    filePath: signedUpload.filePath || signedUpload.path,
    token: signedUpload.token,
    onProgress,
    onDebugStep
  });

  return {
    bucket: signedUpload.bucket || bucket,
    filePath: signedUpload.filePath || signedUpload.path,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size
  };
}
