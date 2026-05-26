require("dotenv").config();

const express = require("express");
const cors = require("cors");
const aiRoutes = require("./src/routes/aiRoutes");

const app = express();

const allowedOrigins = String(process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "revision-ai-backend",
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
