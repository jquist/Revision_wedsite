const { createClient } = require("@supabase/supabase-js");

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false
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

module.exports = {
  getSupabaseAdmin,
  downloadStorageFile
};
