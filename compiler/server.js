require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { runCodeAgainstTestCases, SUPPORTED_LANGUAGES } = require("./codeRunner");

// IS_DEPLOYED can be used as a toggle, but configuration is primarily from .env
const IS_DEPLOYED = process.env.NODE_ENV === "production"; 
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const app = express();
const PORT = process.env.PORT || 5001;

const LOCAL_DEVELOPMENT_ORIGINS = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
];

const normaliseOrigin = (value) => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
};

const getAllowedOrigins = () => {
  const allowed = new Set(LOCAL_DEVELOPMENT_ORIGINS);
  if (process.env.BACKEND_URL) {
    const normalised = normaliseOrigin(process.env.BACKEND_URL);
    if (normalised) {
      allowed.add(normalised);
    }
  }
  return allowed;
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like server-to-server fetch, curl, etc.)
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    const error = new Error("Request origin is not allowed by CORS.");
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

app.post("/run", async (req, res) => {
  const { code, language, testCases, timeLimitMs } = req.body;

  try {
    // Validate request payload
    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Code cannot be empty." });
    }
    if (!language) {
      return res.status(400).json({ message: "Language is required." });
    }
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ message: "At least one test case is required." });
    }

    const result = await runCodeAgainstTestCases({
      code,
      language,
      testCases,
      timeLimitMs,
    });
    res.json(result);
  } catch (error) {
    console.error("Error in /run endpoint:", error);
    res.status(400).json({ message: error.message || "Failed to run code." });
  }
});

app.get("/languages", (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});

app.listen(PORT, () => {
  console.log(`Compiler service running on port ${PORT}`);
});
