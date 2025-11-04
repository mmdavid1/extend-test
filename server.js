// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
app.use(cors()); // allow your local file/localhost to hit this server
app.use(express.json({ limit: "5mb" }));

const EXTEND_HEADERS = {
  Authorization: `Bearer ${process.env.EXTEND_API_KEY}`,
  "x-extend-api-version": process.env.EXTEND_API_VERSION || "2025-04-21",
};

// 1) Upload a file -> returns fileId
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB cap
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const form = new FormData();
    form.append("file", req.file.buffer, { filename: req.file.originalname });

    const r = await axios.post("https://api.extend.ai/files/upload", form, {
      headers: { ...EXTEND_HEADERS, ...form.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    res.json({ fileId: r.data.file.id, raw: r.data });
  } catch (err) {
    const data = err.response?.data || { message: err.message };
    res.status(err.response?.status || 500).json({ error: "upload_failed", data });
  }
});

// 2) Run processor (by fileId or fileUrl). Pass through optional config + sync.
app.post("/api/run", async (req, res) => {
  try {
    const { processorId, fileId, fileUrl, config, sync = true } = req.body;
    if (!processorId || (!fileId && !fileUrl)) {
      return res.status(400).json({ error: "missing_params" });
    }

    const payload = {
      processorId,
      file: fileId ? { fileId } : { fileUrl },
      sync,
      ...(config ? { config } : {}),
    };

    const r = await axios.post("https://api.extend.ai/processor_runs", payload, {
      headers: { ...EXTEND_HEADERS, "Content-Type": "application/json" },
    });

    res.json(r.data);
  } catch (err) {
    const data = err.response?.data || { message: err.message };
    res.status(err.response?.status || 500).json({ error: "run_failed", data });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Proxy listening on http://localhost:${process.env.PORT || 3000}`)
);
