const jobs = new Map();

function createJob(initialData = {}) {
  const jobId = `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const job = {
    jobId,
    status: "pending",
    progress: 0,
    message: "Queued",
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...initialData
  };

  jobs.set(jobId, job);
  return job;
}

function updateJob(jobId, patch) {
  const current = jobs.get(jobId);

  if (!current) {
    return null;
  }

  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };

  jobs.set(jobId, updated);
  return updated;
}

function getJob(jobId) {
  return jobs.get(jobId) || null;
}

module.exports = {
  createJob,
  updateJob,
  getJob
};
