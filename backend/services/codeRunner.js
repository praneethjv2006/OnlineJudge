// Note: This service requires Node.js 18+ for the built-in fetch API.
// If using an older version, please install and use 'node-fetch' or 'axios'.
const SUPPORTED_LANGUAGES = ["python", "cpp", "c", "javascript"];

const COMPILER_SERVICE_URL = process.env.COMPILER_SERVICE_URL || "http://localhost:5001";

const updateSupportedLanguages = async () => {
  try {
    const response = await fetch(`${COMPILER_SERVICE_URL}/languages`);
    if (response.ok) {
      const data = await response.json();
      SUPPORTED_LANGUAGES.length = 0;
      SUPPORTED_LANGUAGES.push(...data.languages);
    }
  } catch (error) {
    console.error("Failed to fetch supported languages from compiler service:", error.message);
  }
};

// Initial fetch
updateSupportedLanguages();

const runCodeAgainstTestCases = async ({ code, language, testCases, timeLimitMs = 2000 }) => {
  const response = await fetch(`${COMPILER_SERVICE_URL}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      language,
      testCases,
      timeLimitMs,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to run code");
  }

  return response.json();
};

module.exports = {
  SUPPORTED_LANGUAGES,
  runCodeAgainstTestCases,
};
