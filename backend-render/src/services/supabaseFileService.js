const WebSocket = require("ws");

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

const { createClient } = require("@supabase/supabase-js");

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (url.includes("/rest/v1")) {
    throw new Error("SUPABASE_URL should be the project URL only, without /rest/v1.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    realtime: {
      transport: WebSocket
    }
  });
}

async function downloadStorageFile({ bucket, filePath }) {
  const supabase = getSupabaseAdmin();
  const storageBucket = bucket || process.env.SUPABASE_UPLOAD_BUCKET || "lecture-files";

  if (!filePath) {
    throw new Error("Missing filePath.");
  }

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .download(filePath);

  if (error) {
    throw new Error(`Could not download file from storage: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function createSignedLectureUpload({ bucket, filePath }) {
  const supabase = getSupabaseAdmin();
  const storageBucket = bucket || process.env.SUPABASE_UPLOAD_BUCKET || "lecture-files";

  if (!filePath) {
    throw new Error("Missing filePath.");
  }

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUploadUrl(filePath);

  if (error) {
    throw new Error(`Could not create signed upload URL: ${error.message}`);
  }

  return {
    bucket: storageBucket,
    filePath,
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path
  };
}

module.exports = {
  getSupabaseAdmin,
  downloadStorageFile,
  createSignedLectureUpload
};
