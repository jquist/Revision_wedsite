import { supabase } from "../supabaseClient";

/**
 * Uploads a lecture file directly from the browser to Supabase Storage.
 *
 * Expected bucket:
 *   lecture-files
 *
 * This avoids sending big files through your Express API body.
 */
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

  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-");

  const filePath = `${userId}/${subjectId}/${Date.now()}-${safeName}`;

  /**
   * Supabase JS standard upload does not expose progress in all environments.
   * We still accept onProgress so the component can show "uploading".
   * If you later swap to resumable/TUS upload, this function is the only place
   * that needs to change.
   */
  if (onProgress) onProgress(5);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw error;
  }

  if (onProgress) onProgress(100);

  return {
    bucket,
    filePath,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    storageData: data
  };
}
