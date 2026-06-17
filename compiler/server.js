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
    const result = await runCodeAgainstTestCases({
      code,
      language,
      testCases,
      timeLimitMs,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/languages", (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});

app.listen(PORT, () => {
  console.log(`Compiler service running on port ${PORT}`);
});
