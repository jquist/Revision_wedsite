import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import { supabase } from "../utils/supabaseClient";
import { getSupabaseAnonKey, getSupabaseUrl } from "../config/env";

const RESUMABLE_THRESHOLD_BYTES = 6 * 1024 * 1024;

function buildSafeFilePath({ file, userId, subjectId }) {
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-");

  return `${userId}/${subjectId}/${Date.now()}-${safeName}`;
}

async function uploadStandard({ file, bucket, filePath, onProgress }) {
  if (onProgress) onProgress(5);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });

  if (error) {
    throw error;
  }

  if (onProgress) onProgress(100);

  return data;
}

async function uploadResumable({ file, bucket, filePath, onProgress }) {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) {
    return uploadStandard({ file, bucket, filePath, onProgress });
  }

  const uppy = new Uppy({
    autoProceed: false,
    restrictions: {
      maxNumberOfFiles: 1
    }
  });

  uppy.use(Tus, {
    endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
    headers: {
      authorization: `Bearer ${anonKey}`,
      apikey: anonKey
    },
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    chunkSize: 6 * 1024 * 1024,
    allowedMetaFields: [
      "bucketName",
      "objectName",
      "contentType",
      "cacheControl"
    ]
  });

  uppy.on("upload-progress", (fileData, progress) => {
    if (!onProgress) return;

    const percentage = progress.bytesTotal
      ? Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
      : 0;

    onProgress(percentage);
  });

  uppy.addFile({
    name: file.name,
    type: file.type || "application/octet-stream",
    data: file,
    meta: {
      bucketName: bucket,
      objectName: filePath,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600"
    }
  });

  try {
    const result = await uppy.upload();

    if (result.failed?.length) {
      throw result.failed[0].error || new Error("Resumable upload failed.");
    }

    return result.successful?.[0] || null;
  } finally {
    try {
      if (typeof uppy.cancelAll === "function") {
        uppy.cancelAll();
      }
      if (typeof uppy.destroy === "function") {
        uppy.destroy();
      }
    } catch (cleanupError) {
      // Ignore Uppy cleanup differences across versions.
    }
  }
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

  const filePath = buildSafeFilePath({
    file,
    userId,
    subjectId
  });

  if (file.size >= RESUMABLE_THRESHOLD_BYTES) {
    await uploadResumable({
      file,
      bucket,
      filePath,
      onProgress
    });
  } else {
    await uploadStandard({
      file,
      bucket,
      filePath,
      onProgress
    });
  }

  return {
    bucket,
    filePath,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size
  };
}
