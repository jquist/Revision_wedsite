require("dotenv").config();

const express = require("express");
const cors = require("cors");
const aiRoutes = require("./src/routes/aiRoutes");

const app = express();

function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/+$/, "");
}

const allowedOrigins = String(process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const cleanOrigin = normalizeOrigin(origin);

    if (!cleanOrigin || allowedOrigins.length === 0 || allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${cleanOrigin}. FRONTEND_ORIGIN currently allows: ${allowedOrigins.join(", ") || "all origins"}`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "revision-ai-backend",
    nodeVersion: process.version,
    hasNativeWebSocket: typeof globalThis.WebSocket !== "undefined",
    aiProvider: process.env.AI_PROVIDER || "openai",
    requestOrigin: req.get("origin") || null,
    allowedOrigins,
    time: new Date().toISOString()
  });
});

app.use("/api/ai", aiRoutes);

app.use((error, req, res, next) => {
  console.error("Unhandled backend error:", error);

  res.status(500).json({
    success: false,
    error: error.message || "Unexpected server error."
  });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Revision AI backend running on port ${port}`);
});
