require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { runCodeAgainstTestCases, SUPPORTED_LANGUAGES } = require("./codeRunner");

// IS_DEPLOYED can be used as a toggle, but configuration is primarily from .env
const IS_DEPLOYED = process.env.NODE_ENV === "production"; 
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
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
